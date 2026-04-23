// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./MarketplaceFeeManager.sol";
import "./NFTCollection.sol";

/**
 * @title Marketplace
 * @dev Central marketplace contract for NFT trading
 * @notice Handles listing, buying, and fee management for NFT transactions
 * @author NexArt Team
 */
contract Marketplace is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Address for address payable;

    /// @dev Fee manager contract for marketplace fees
    MarketplaceFeeManager public immutable feeManager;

    /// @dev Mapping from listing ID to listing details
    mapping(bytes32 => Listing) public listings;

    /// @dev Mapping from seller to their listing IDs
    mapping(address => bytes32[]) public sellerListings;

    /// @dev Mapping from NFT contract to token ID to listing ID
    mapping(address => mapping(uint256 => bytes32)) public nftToListing;

    /// @dev Array of all active listing IDs
    bytes32[] public activeListings;

    /// @dev Mapping from listing ID to index in activeListings array
    mapping(bytes32 => uint256) public listingToIndex;

    /// @dev Mapping to track if listing ID is active
    mapping(bytes32 => bool) public isActiveListing;

    /// @dev Supported ERC20 payment tokens
    mapping(address => bool) public supportedTokens;

    /// @dev Minimum listing price in wei
    uint256 public minimumListingPrice;

    /**
     * @dev Listing structure
     */
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken; // address(0) for ETH
        uint256 createdAt;
        bool isActive;
    }

    /**
     * @dev Custom errors for gas efficiency
     */
    error InvalidNFTContract();
    error NotNFTOwner();
    error NFTNotApproved();
    error InvalidPrice();
    error ListingNotFound();
    error ListingNotActive();
    error NotListingSeller();
    error InsufficientPayment();
    error UnsupportedPaymentToken();
    error TransferFailed();
    error InvalidFeeManager();
    error ListingAlreadyExists();
    error PriceBelowMinimum();

    /**
     * @dev Events
     */
    event ItemListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    );

    event ItemSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken,
        uint256 marketFee,
        uint256 royaltyFee
    );

    event ListingCancelled(
        bytes32 indexed listingId,
        address indexed seller,
        address nftContract,
        uint256 tokenId
    );

    event PaymentTokenUpdated(address indexed token, bool supported);
    event MinimumListingPriceUpdated(uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Constructor initializes the marketplace
     * @param initialOwner Initial owner of the marketplace
     * @param feeManager_ Address of the fee manager contract (address of MarketplaceFeeManager has been deployed before)
     * @param minimumListingPrice_ Minimum listing price in wei
     */
    constructor(
        address initialOwner,
        address feeManager_,
        uint256 minimumListingPrice_
    ) Ownable(initialOwner) {
        if (feeManager_ == address(0)) {
            revert InvalidFeeManager();
        }

        feeManager = MarketplaceFeeManager(payable(feeManager_));
        minimumListingPrice = minimumListingPrice_;

        // ETH is supported by default
        supportedTokens[address(0)] = true;

        emit MinimumListingPriceUpdated(0, minimumListingPrice_);
    }

    /**
     * @dev Lists an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Listing price
     * @param paymentToken Payment token address (address(0) for ETH)
     * @return listingId Generated listing ID
     * @notice Caller must be the owner of the NFT and have approved the marketplace
     * @notice
        * Frontend - user must approve before listing
            const nftContract = new ethers.Contract(nftAddress, NFTCollection.abi, signer);

            // Option 1: Approve specific token
            await nftContract.approve(marketplaceAddress, tokenId);

            // Option 2: Approve all tokens (recommended)
            await nftContract.setApprovalForAll(marketplaceAddress, true);

            After we can list NFT
            await marketplace.listItem(nftAddress, tokenId, price, paymentToken);
        *
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    ) external nonReentrant whenNotPaused returns (bytes32) {
        if (price < minimumListingPrice) {
            revert PriceBelowMinimum();
        }

        if (!supportedTokens[paymentToken]) {
            revert UnsupportedPaymentToken();
        }

        IERC721 nft = IERC721(nftContract);

        // Verify ownership
        if (nft.ownerOf(tokenId) != msg.sender) {
            revert NotNFTOwner();
        }

        // Verify approval
        if (
            !nft.isApprovedForAll(msg.sender, address(this)) &&
            nft.getApproved(tokenId) != address(this)
        ) {
            revert NFTNotApproved();
        }

        // Check if already listed
        bytes32 existingListingId = nftToListing[nftContract][tokenId];
        if (
            existingListingId != bytes32(0) &&
            isActiveListing[existingListingId]
        ) {
            revert ListingAlreadyExists();
        }

        // Generate unique listing ID
        bytes32 listingId = keccak256(
            abi.encodePacked(
                nftContract,
                tokenId,
                msg.sender,
                block.timestamp,
                block.number
            )
        );

        // Create listing
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            paymentToken: paymentToken,
            createdAt: block.timestamp,
            isActive: true
        });

        // Update mappings
        sellerListings[msg.sender].push(listingId);
        nftToListing[nftContract][tokenId] = listingId;
        uint256 index = activeListings.length;
        activeListings.push(listingId);
        listingToIndex[listingId] = index;
        isActiveListing[listingId] = true;

        emit ItemListed(
            listingId,
            msg.sender,
            nftContract,
            tokenId,
            price,
            paymentToken
        );

        return listingId;
    }

    /**
     * @dev Buys a listed NFT
     * @param listingId ID of the listing to purchase
     */
    function buyItem(
        bytes32 listingId
    ) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];

        if (!listing.isActive) {
            revert ListingNotActive();
        }

        address seller = listing.seller;
        address nftContract = listing.nftContract;
        uint256 tokenId = listing.tokenId;
        uint256 price = listing.price;
        address paymentToken = listing.paymentToken;

        // Verify NFT ownership hasn't changed
        IERC721 nft = IERC721(nftContract);
        if (nft.ownerOf(tokenId) != seller) {
            revert NotNFTOwner();
        }

        // Calculate fees
        uint256 marketFee = feeManager.calculateMarketFee(price);
        uint256 royaltyFee = 0;
        address royaltyRecipient = address(0);

        // Calculate royalty if NFTCollection
        try NFTCollection(nftContract).getTokenRoyalty(tokenId) returns (
            address creator,
            uint256 royaltyBps
        ) {
            if (creator != seller && royaltyBps > 0) {
                royaltyFee = (price * royaltyBps) / 10000;
                royaltyRecipient = creator;
            }
        } catch {
            // Not an NFTCollection or royalty query failed, continue without royalty
        }

        uint256 sellerAmount = price - marketFee - royaltyFee;

        // Handle payment
        if (paymentToken == address(0)) {
            // ETH payment
            if (msg.value < price) {
                revert InsufficientPayment();
            }

            _processETHPayment(
                seller,
                royaltyRecipient,
                sellerAmount,
                marketFee,
                royaltyFee
            );

            // Refund excess
            if (msg.value > price) {
                payable(msg.sender).sendValue(msg.value - price);
            }
        } else {
            // ERC20 payment
            if (msg.value > 0) {
                revert InsufficientPayment(); // Should not send ETH for ERC20 payment
            }

            _processTokenPayment(
                paymentToken,
                seller,
                royaltyRecipient,
                sellerAmount,
                marketFee,
                royaltyFee
            );
        }

        // Transfer NFT
        nft.safeTransferFrom(seller, msg.sender, tokenId);

        // Deactivate listing
        _deactivateListing(listingId, nftContract, tokenId);

        emit ItemSold(
            listingId,
            msg.sender,
            seller,
            nftContract,
            tokenId,
            price,
            paymentToken,
            marketFee,
            royaltyFee
        );
    }

    /**
     * @dev Cancels a listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.isActive) {
            revert ListingNotActive();
        }

        if (listing.seller != msg.sender && owner() != msg.sender) {
            revert NotListingSeller();
        }

        address nftContract = listing.nftContract;
        uint256 tokenId = listing.tokenId;

        _deactivateListing(listingId, nftContract, tokenId);

        emit ListingCancelled(listingId, listing.seller, nftContract, tokenId);
    }

    /**
     * @dev Updates the price of an existing listing
     * @param listingId ID of the listing to update
     * @param newPrice New price for the listing
     */
    function updateListingPrice(
        bytes32 listingId,
        uint256 newPrice
    ) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.isActive) {
            revert ListingNotActive();
        }

        if (listing.seller != msg.sender) {
            revert NotListingSeller();
        }

        if (newPrice < minimumListingPrice) {
            revert PriceBelowMinimum();
        }

        listing.price = newPrice;

        emit ItemListed(
            listingId,
            msg.sender,
            listing.nftContract,
            listing.tokenId,
            newPrice,
            listing.paymentToken
        );
    }

    /**
     * @dev Returns listing details
     * @param listingId ID of the listing
     */
    function getListing(
        bytes32 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Returns all listings by a seller
     * @param seller Seller address
     * @return sellerListingIds Array of listing IDs
     */
    function getSellerListings(
        address seller
    ) external view returns (bytes32[] memory) {
        return sellerListings[seller];
    }

    /**
     * @dev Returns paginated active listings
     * @param offset Starting index
     * @param limit Maximum number of listings to return
     * @return listingIds Array of listing IDs
     * @return total Total number of active listings
     */
    function getActiveListings(
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory listingIds, uint256 total) {
        total = activeListings.length;

        if (offset >= total) {
            return (new bytes32[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        listingIds = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            listingIds[i - offset] = activeListings[i];
        }

        return (listingIds, total);
    }

    /**
     * @dev Adds or removes support for a payment token
     * @param token Token address
     * @param supported Whether the token is supported
     */
    function updatePaymentToken(
        address token,
        bool supported
    ) external onlyOwner {
        supportedTokens[token] = supported;
        emit PaymentTokenUpdated(token, supported);
    }

    /**
     * @dev Updates minimum listing price
     * @param newPrice New minimum price
     */
    function updateMinimumListingPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = minimumListingPrice;
        minimumListingPrice = newPrice;
        emit MinimumListingPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to cancel any listing (admin only)
     * @param listingId ID of the listing to cancel
     */
    function emergencyCancelListing(bytes32 listingId) external onlyOwner {
        Listing storage listing = listings[listingId];

        if (listing.isActive) {
            _deactivateListing(listingId, listing.nftContract, listing.tokenId);
            emit ListingCancelled(
                listingId,
                listing.seller,
                listing.nftContract,
                listing.tokenId
            );
        }
    }

    /**
     * @dev Internal function to process ETH payments
     */
    function _processETHPayment(
        address seller,
        address royaltyRecipient,
        uint256 sellerAmount,
        uint256 marketFee,
        uint256 royaltyFee
    ) internal {
        // Transfer to seller
        if (sellerAmount > 0) {
            payable(seller).sendValue(sellerAmount);
        }

        // Transfer market fee
        if (marketFee > 0) {
            (, address feeRecipient, ) = feeManager.getFeeInfo();
            payable(feeRecipient).sendValue(marketFee);
        }

        // Transfer royalty
        if (royaltyFee > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).sendValue(royaltyFee);
        }
    }

    /**
     * @dev Internal function to process ERC20 token payments
     */
    function _processTokenPayment(
        address paymentToken,
        address seller,
        address royaltyRecipient,
        uint256 sellerAmount,
        uint256 marketFee,
        uint256 royaltyFee
    ) internal {
        IERC20 token = IERC20(paymentToken);

        // Transfer to seller
        if (sellerAmount > 0) {
            token.safeTransferFrom(msg.sender, seller, sellerAmount);
        }

        // Transfer market fee
        if (marketFee > 0) {
            (, address feeRecipient, ) = feeManager.getFeeInfo();
            token.safeTransferFrom(msg.sender, feeRecipient, marketFee);
        }

        // Transfer royalty
        if (royaltyFee > 0 && royaltyRecipient != address(0)) {
            token.safeTransferFrom(msg.sender, royaltyRecipient, royaltyFee);
        }
    }

    /**
     * @dev Internal function to deactivate a listing
     */
    function _deactivateListing(
        bytes32 listingId,
        address nftContract,
        uint256 tokenId
    ) internal {
        uint256 indexToRemove = listingToIndex[listingId];
        uint256 lastIndex = activeListings.length - 1;
        listings[listingId].isActive = false;
        isActiveListing[listingId] = false;
        delete nftToListing[nftContract][tokenId];

        // Remove from active listings array
        if (indexToRemove != lastIndex) {
            // Move last element to the position to remove
            bytes32 lastListingId = activeListings[lastIndex];
            activeListings[indexToRemove] = lastListingId;
            listingToIndex[lastListingId] = indexToRemove;
        }

        activeListings.pop();
        delete listingToIndex[listingId];
    }

    /**
     * @dev Returns contract version for upgrade compatibility
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        // Contract can receive ETH for purchases
    }
}

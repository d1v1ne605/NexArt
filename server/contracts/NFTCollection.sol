// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NFTCollection
 * @dev ERC-721 compliant NFT collection contract with enhanced features
 * @notice Each collection is deployed as a separate contract by NFTCollectionFactory
 * @author NexArt Team
 */
contract NFTCollection is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    /// @dev Base URI for token metadata
    string private _baseTokenURI;
    
    /// @dev Current token ID counter
    uint256 private _currentTokenId;
    
    /// @dev Maximum supply of tokens (0 = unlimited)
    uint256 public maxSupply;
    
    /// @dev Collection description
    string public description;
    
    /// @dev Collection external URL
    string public externalUrl;
    
    /// @dev Mapping from token ID to creator
    mapping(uint256 => address) public tokenCreators;
    
    /// @dev Mapping from token ID to royalty percentage (in basis points)
    mapping(uint256 => uint256) public tokenRoyalties;

    /**
     * @dev Custom errors for gas efficiency
     */
    error MaxSupplyExceeded();
    error InvalidRoyaltyPercentage();
    error TokenDoesNotExist();
    error NotTokenOwnerOrApproved();

    /**
     * @dev Events
     */
    event TokenMinted(uint256 indexed tokenId, address indexed to, string tokenURI);
    event BaseURIUpdated(string newBaseURI);
    event RoyaltySet(uint256 indexed tokenId, uint256 royaltyBps);
    event CollectionInfoUpdated(string description, string externalUrl);

    /**
     * @dev Constructor initializes the collection
     * @param name_ Name of the NFT collection
     * @param symbol_ Symbol of the NFT collection
     * @param baseURI_ Base URI for token metadata
     * @param creator_ Address of the collection creator
     * @param maxSupply_ Maximum supply of tokens (0 for unlimited)
     * @param description_ Collection description
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address creator_,
        uint256 maxSupply_,
        string memory description_
    ) ERC721(name_, symbol_) Ownable(creator_) {
        _baseTokenURI = baseURI_;
        maxSupply = maxSupply_;
        description = description_;
        _currentTokenId = 1; // Start from token ID 1
    }

    /**
     * @dev Mints a new NFT to the specified address
     * @param to Address to mint the NFT to
     * @param _tokenURI URI for the token metadata
     * @param royaltyBps Royalty percentage in basis points (e.g., 250 = 2.5%)
     * @notice Only the owner (creator) can mint new NFTs
     */
    function mintNFT(
        address to,
        string memory _tokenURI,
        uint256 royaltyBps
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256) {
        if (maxSupply > 0 && _currentTokenId > maxSupply) {
            revert MaxSupplyExceeded();
        }
        
        if (royaltyBps > 1000) { // Max 10% royalty
            revert InvalidRoyaltyPercentage();
        }

        uint256 tokenId = _currentTokenId;
        _currentTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        tokenCreators[tokenId] = owner();
        tokenRoyalties[tokenId] = royaltyBps;

        emit TokenMinted(tokenId, to, _tokenURI);
        emit RoyaltySet(tokenId, royaltyBps);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple NFTs
     * @param to Address to mint the NFTs to
     * @param tokenURIs Array of token URIs
     * @param royaltyBps Royalty percentage for all tokens
     */
    function batchMintNFT(
        address to,
        string[] memory tokenURIs,
        uint256 royaltyBps
    ) external onlyOwner nonReentrant whenNotPaused returns (uint256[] memory) {
        uint256 quantity = tokenURIs.length;
        
        if (maxSupply > 0 && (_currentTokenId + quantity - 1) > maxSupply) {
            revert MaxSupplyExceeded();
        }
        
        if (royaltyBps > 1000) {
            revert InvalidRoyaltyPercentage();
        }

        uint256[] memory tokenIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _currentTokenId;
            _currentTokenId++;

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            tokenCreators[tokenId] = owner();
            tokenRoyalties[tokenId] = royaltyBps;
            tokenIds[i] = tokenId;

            emit TokenMinted(tokenId, to, tokenURIs[i]);
        }

        emit RoyaltySet(0, royaltyBps); // Emit once for batch

        return tokenIds;
    }

    /**
     * @dev Burns a token
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) external {
        if (!_isAuthorized(owner(), msg.sender, tokenId)) {
            revert NotTokenOwnerOrApproved();
        }
        _burn(tokenId);
    }

    /**
     * @dev Updates the base URI for all tokens
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Updates collection information
     * @param newDescription New description
     * @param newExternalUrl New external URL
     */
    function updateCollectionInfo(
        string memory newDescription,
        string memory newExternalUrl
    ) external onlyOwner {
        description = newDescription;
        externalUrl = newExternalUrl;
        emit CollectionInfoUpdated(newDescription, newExternalUrl);
    }

    /**
     * @dev Sets royalty for a specific token
     * @param tokenId Token ID
     * @param royaltyBps Royalty in basis points
     */
    function setTokenRoyalty(uint256 tokenId, uint256 royaltyBps) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist();
        }
        if (royaltyBps > 1000) {
            revert InvalidRoyaltyPercentage();
        }
        
        tokenRoyalties[tokenId] = royaltyBps;
        emit RoyaltySet(tokenId, royaltyBps);
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
     * @dev Returns the total number of tokens minted
     */
    function totalMinted() external view returns (uint256) {
        return _currentTokenId - 1;
    }

    /**
     * @dev Returns token royalty information
     * @param tokenId Token ID
     * @return creator Creator address
     * @return royaltyBps Royalty in basis points
     */
    function getTokenRoyalty(uint256 tokenId) external view returns (address creator, uint256 royaltyBps) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist();
        }
        return (tokenCreators[tokenId], tokenRoyalties[tokenId]);
    }

    /**
     * @dev Returns collection statistics
     */
    function getCollectionStats() external view returns (
        uint256 totalSupply_,
        uint256 totalMinted_,
        uint256 maxSupply_,
        address creator,
        string memory description_,
        string memory externalUrl_
    ) {
        return (
            totalSupply(),
            _currentTokenId - 1,
            maxSupply,
            owner(),
            description,
            externalUrl
        );
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {ERC721-_update}
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev See {ERC721-_increaseBalance}
     */
    function _increaseBalance(address account, uint128 value)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev See {ERC721-tokenURI}
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Returns the base URI for tokens
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
}
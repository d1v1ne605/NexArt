// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./NFTCollection.sol";

/**
 * @title NFTCollectionFactory
 * @dev Factory contract for deploying NFT collections
 * @notice Deploys NFT collections for creators
 * @author NexArt Team
 */
contract NFTCollectionFactory is Ownable, ReentrancyGuard, Pausable {
    /// @dev Mapping from creator to their collections
    mapping(address => address[]) public creatorCollections;
    
    /// @dev Mapping to check if an address is a valid collection
    mapping(address => bool) public isValidCollection;
    
    /// @dev Array of all created collections
    address[] public allCollections;
    
    /// @dev Deployment fee for creating collections
    uint256 public deploymentFee;
    
    /// @dev Address to receive deployment fees
    address public feeRecipient;
    
    /// @dev Maximum collections per creator (0 for unlimited)
    uint256 public maxCollectionsPerCreator;

    /**
     * @dev Custom errors for gas efficiency
     */
    error InsufficientDeploymentFee();
    error InvalidCreator();
    error InvalidFeeRecipient();
    error MaxCollectionsExceeded();
    error CollectionNotFound();
    error DeploymentFailed();

    /**
     * @dev Events
     */
    event CollectionCreated(
        address indexed collection,
        address indexed creator,
        string name,
        string symbol,
        uint256 maxSupply
    );
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event MaxCollectionsPerCreatorUpdated(uint256 oldMax, uint256 newMax);

    /**
     * @dev Struct to hold collection creation parameters
     */
    struct CollectionParams {
        string name;
        string symbol;
        string baseURI;
        uint256 maxSupply;
        string description;
    }

    /**
     * @dev Constructor initializes the factory
     * @param initialOwner Initial owner of the factory
     * @param deploymentFee_ Initial deployment fee
     * @param feeRecipient_ Initial fee recipient
     */
    constructor(
        address initialOwner,
        uint256 deploymentFee_,
        address feeRecipient_
    ) Ownable(initialOwner) {
        if (feeRecipient_ == address(0)) {
            revert InvalidFeeRecipient();
        }

        deploymentFee = deploymentFee_;
        feeRecipient = feeRecipient_;
        maxCollectionsPerCreator = 0; // Unlimited by default

        emit DeploymentFeeUpdated(0, deploymentFee_);
        emit FeeRecipientUpdated(address(0), feeRecipient_);
    }

    /**
     * @dev Creates a new NFT collection
     * @param params Collection creation parameters
     * @return collection Address of the created collection
     */
    function createCollection(
        CollectionParams calldata params
    ) external payable nonReentrant whenNotPaused returns (address collection) {
        if (msg.value < deploymentFee) {
            revert InsufficientDeploymentFee();
        }

        if (maxCollectionsPerCreator > 0 && 
            creatorCollections[msg.sender].length >= maxCollectionsPerCreator) {
            revert MaxCollectionsExceeded();
        }

        // Deploy new NFTCollection contract
        try new NFTCollection(
            params.name,
            params.symbol,
            params.baseURI,
            msg.sender,
            params.maxSupply,
            params.description
        ) returns (NFTCollection newCollection) {
            collection = address(newCollection);
        } catch {
            revert DeploymentFailed();
        }

        // Update mappings and arrays
        creatorCollections[msg.sender].push(collection);
        isValidCollection[collection] = true;
        allCollections.push(collection);

        // Transfer deployment fee
        if (deploymentFee > 0) {
            payable(feeRecipient).transfer(deploymentFee);
        }

        // Refund excess payment
        if (msg.value > deploymentFee) {
            payable(msg.sender).transfer(msg.value - deploymentFee);
        }

        emit CollectionCreated(
            collection,
            msg.sender,
            params.name,
            params.symbol,
            params.maxSupply
        );

        return collection;
    }

    /**
     * @dev Creates a collection with free deployment for whitelisted creators
     * @param params Collection creation parameters
     * @param creator Creator address
     * @return collection Address of the created collection
     */
    function createCollectionForCreator(
        CollectionParams calldata params,
        address creator
    ) external onlyOwner nonReentrant returns (address collection) {
        if (creator == address(0)) {
            revert InvalidCreator();
        }

        if (maxCollectionsPerCreator > 0 && 
            creatorCollections[creator].length >= maxCollectionsPerCreator) {
            revert MaxCollectionsExceeded();
        }

        // Deploy new NFTCollection contract
        try new NFTCollection(
            params.name,
            params.symbol,
            params.baseURI,
            creator,
            params.maxSupply,
            params.description
        ) returns (NFTCollection newCollection) {
            collection = address(newCollection);
        } catch {
            revert DeploymentFailed();
        }

        // Update mappings and arrays
        creatorCollections[creator].push(collection);
        isValidCollection[collection] = true;
        allCollections.push(collection);

        emit CollectionCreated(
            collection,
            creator,
            params.name,
            params.symbol,
            params.maxSupply
        );

        return collection;
    }

    /**
     * @dev Returns all collections created by a specific creator
     * @param creator Creator address
     * @return collections Array of collection addresses
     */
    function getCreatorCollections(address creator) external view returns (address[] memory) {
        return creatorCollections[creator];
    }

    /**
     * @dev Returns collection information
     * @param collection Collection address
     * @return isValid Whether the collection is valid
     * @return creator Creator address
     * @return totalSupply Total supply of the collection
     */
    function getCollectionInfo(address collection) external view returns (
        bool isValid,
        address creator,
        uint256 totalSupply
    ) {
        if (!isValidCollection[collection]) {
            return (false, address(0), 0);
        }

        NFTCollection nftCollection = NFTCollection(collection);
        return (
            true,
            nftCollection.owner(),
            nftCollection.totalSupply()
        );
    }

    /**
     * @dev Returns paginated list of all collections
     * @param offset Starting index
     * @param limit Maximum number of collections to return
     * @return collections Array of collection addresses
     * @return total Total number of collections
     */
    function getAllCollections(uint256 offset, uint256 limit) external view returns (
        address[] memory collections,
        uint256 total
    ) {
        total = allCollections.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        collections = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            collections[i - offset] = allCollections[i];
        }

        return (collections, total);
    }

    /**
     * @dev Returns the total number of collections
     */
    function getTotalCollections() external view returns (uint256) {
        return allCollections.length;
    }

    /**
     * @dev Returns the number of collections created by a creator
     * @param creator Creator address
     */
    function getCreatorCollectionCount(address creator) external view returns (uint256) {
        return creatorCollections[creator].length;
    }

    /**
     * @dev Updates the deployment fee
     * @param newFee New deployment fee
     */
    function updateDeploymentFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = deploymentFee;
        deploymentFee = newFee;
        emit DeploymentFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Updates the fee recipient
     * @param newRecipient New fee recipient address
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) {
            revert InvalidFeeRecipient();
        }
        
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @dev Updates maximum collections per creator
     * @param newMax New maximum (0 for unlimited)
     */
    function updateMaxCollectionsPerCreator(uint256 newMax) external onlyOwner {
        uint256 oldMax = maxCollectionsPerCreator;
        maxCollectionsPerCreator = newMax;
        emit MaxCollectionsPerCreatorUpdated(oldMax, newMax);
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
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
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
        // Contract can receive ETH for deployment fees
    }
}
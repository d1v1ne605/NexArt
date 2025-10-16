// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MarketplaceFeeManager
 * @dev Manages marketplace fees and fee recipient
 * @notice Centralized fee management for easy updates and transparency
 * @author NexArt Team
 */
contract MarketplaceFeeManager is Ownable, ReentrancyGuard, Pausable {
    /// @dev Maximum fee percentage in basis points (10% = 1000 bps)
    uint256 public constant MAX_FEE_BPS = 1000;
    
    /// @dev Current marketplace fee in basis points
    uint256 public marketFeeBps;
    
    /// @dev Address that receives marketplace fees
    address public feeRecipient;
    
    /// @dev Minimum fee in wei (to prevent zero-fee exploits)
    uint256 public minimumFee;

    /**
     * @dev Custom errors for gas efficiency
     */
    error InvalidFeePercentage();
    error InvalidFeeRecipient();
    error InvalidMinimumFee();
    error UnauthorizedAccess();

    /**
     * @dev Events
     */
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event MinimumFeeUpdated(uint256 oldMinimumFee, uint256 newMinimumFee);
    event FeesWithdrawn(address recipient, uint256 amount);

    /**
     * @dev Constructor initializes fee manager
     * @param initialOwner Initial owner of the contract
     * @param initialFeeBps Initial fee percentage in basis points
     * @param initialFeeRecipient Initial fee recipient address
     * @param initialMinimumFee Initial minimum fee in wei
     */
    constructor(
        address initialOwner,
        uint256 initialFeeBps,
        address initialFeeRecipient,
        uint256 initialMinimumFee
    ) Ownable(initialOwner) {
        if (initialFeeBps > MAX_FEE_BPS) {
            revert InvalidFeePercentage();
        }
        if (initialFeeRecipient == address(0)) {
            revert InvalidFeeRecipient();
        }

        marketFeeBps = initialFeeBps;
        feeRecipient = initialFeeRecipient;
        minimumFee = initialMinimumFee;

        emit FeeUpdated(0, initialFeeBps);
        emit FeeRecipientUpdated(address(0), initialFeeRecipient);
        emit MinimumFeeUpdated(0, initialMinimumFee);
    }

    /**
     * @dev Updates the marketplace fee percentage
     * @param newFeeBps New fee percentage in basis points
     * @notice Only owner can update the fee
     */
    function updateMarketFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) {
            revert InvalidFeePercentage();
        }

        uint256 oldFeeBps = marketFeeBps;
        marketFeeBps = newFeeBps;

        emit FeeUpdated(oldFeeBps, newFeeBps);
    }

    /**
     * @dev Updates the fee recipient address
     * @param newFeeRecipient New fee recipient address
     * @notice Only owner can update the fee recipient
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        if (newFeeRecipient == address(0)) {
            revert InvalidFeeRecipient();
        }

        address oldRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;

        emit FeeRecipientUpdated(oldRecipient, newFeeRecipient);
    }

    /**
     * @dev Updates the minimum fee
     * @param newMinimumFee New minimum fee in wei
     * @notice Only owner can update the minimum fee
     */
    function updateMinimumFee(uint256 newMinimumFee) external onlyOwner {
        uint256 oldMinimumFee = minimumFee;
        minimumFee = newMinimumFee;

        emit MinimumFeeUpdated(oldMinimumFee, newMinimumFee);
    }

    /**
     * @dev Calculates the marketplace fee for a given sale price
     * @param salePrice Sale price in wei
     * @return feeAmount Fee amount in wei
     */
    function calculateMarketFee(uint256 salePrice) external view returns (uint256) {
        uint256 calculatedFee = (salePrice * marketFeeBps) / 10000;
        return calculatedFee > minimumFee ? calculatedFee : minimumFee;
    }

    /**
     * @dev Returns current fee information
     * @return feeBps Current fee in basis points
     * @return recipient Current fee recipient
     * @return minFee Current minimum fee
     */
    function getFeeInfo() external view returns (
        uint256 feeBps,
        address recipient,
        uint256 minFee
    ) {
        return (marketFeeBps, feeRecipient, minimumFee);
    }

    /**
     * @dev Calculates fee breakdown for a sale
     * @param salePrice Sale price in wei
     * @return marketFee Marketplace fee
     * @return sellerAmount Amount seller receives
     */
    function calculateFeeBreakdown(uint256 salePrice) external view returns (
        uint256 marketFee,
        uint256 sellerAmount
    ) {
        marketFee = this.calculateMarketFee(salePrice);
        sellerAmount = salePrice - marketFee;
        return (marketFee, sellerAmount);
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
     * @param amount Amount to withdraw (0 for all)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        uint256 withdrawAmount = amount == 0 ? balance : amount;
        
        if (withdrawAmount > balance) {
            withdrawAmount = balance;
        }

        if (withdrawAmount > 0) {
            payable(owner()).transfer(withdrawAmount);
            emit FeesWithdrawn(owner(), withdrawAmount);
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
        // Contract can receive ETH for fee collection
    }
}
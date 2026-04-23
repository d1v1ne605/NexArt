# NexArt NFT Marketplace Smart Contracts

Complete smart contract system for NFT marketplace written in Solidity with OpenZeppelin libraries.

## Table of Contents

- [System Architecture](#-system-architecture)
- [Setup and Deployment](#-setup-and-deployment)
- [Contract Addresses](#-contract-addresses-after-deployment)
- [Usage Examples](#-usage-examples)
- [Security Features](#-security-features)
- [Fee Structure](#-fee-structure)
- [Testing](#-testing)
- [Gas Optimization](#-gas-optimization)
- [Upgrade Strategy](#-upgrade-strategy)
- [Events](#-events)
- [Important Notes](#-important-notes)
- [Production Checklist](#-production-checklist)

---

## System Architecture

### 1. **NFTCollection.sol**
- **Purpose**: ERC-721 compliant NFT collection contract
- **Features**:
  - Mint NFTs with metadata URI and royalty
  - Batch mint multiple NFTs
  - Manage royalties for each token
  - Burn tokens
  - Pause/unpause functionality
  - Collection metadata management

### 2. **NFTCollectionFactory.sol**  
- **Purpose**: Factory contract to deploy NFT collections
- **Features**:
  - Deploy new collections for creators
  - Track all collections and creators
  - Deployment fee management
  - Maximum collections per creator limit
  - Emergency controls

### 3. **Marketplace.sol**
- **Purpose**: Central marketplace for NFT trading
- **Features**:
  - List NFTs for sale (ETH and ERC20 tokens)
  - Buy NFTs with automatic fee distribution
  - Cancel listings
  - Update listing prices
  - Royalty support for creators
  - Paginated queries
  - Emergency controls

### 4. **MarketplaceFeeManager.sol**
- **Purpose**: Centralized fee management
- **Features**:
  - Configurable marketplace fees
  - Minimum fee enforcement
  - Fee recipient management
  - Fee calculation utilities

---

## Setup and Deployment

### Prerequisites
```bash
npm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Network
```bash
# Start local node
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.ts --network localhost
```

### Deploy using Ignition
```bash
npx hardhat ignition deploy ignition/modules/NFTMarketplace.ts --network localhost
```

---

## Contract Addresses (After Deployment)

After deployment, contract addresses will be displayed. Save them for use in frontend/backend configuration.

---

## Usage Examples

### 1. Creating an NFT Collection

```javascript
// Connect to factory contract
const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

// Collection parameters
const params = {
  name: "My NFT Collection",
  symbol: "MNC", 
  baseURI: "https://api.mynft.com/metadata/",
  maxSupply: 10000,
  description: "My amazing NFT collection"
};

// Create collection (requires deployment fee)
const tx = await factory.createCollection(params, {
  value: ethers.parseEther("0.01")
});
await tx.wait();
```

### 2. Minting an NFT

```javascript
// Get collection contract
const collection = new ethers.Contract(collectionAddress, nftABI, signer);

// Mint NFT
const tx = await collection.mintNFT(
  recipientAddress,
  "token-metadata-uri",
  250 // 2.5% royalty
);
await tx.wait();
```

### 3. Listing NFT on Marketplace

```javascript
// Approve marketplace first
await nftContract.setApprovalForAll(marketplaceAddress, true);

// List NFT
const tx = await marketplace.listItem(
  nftContractAddress,
  tokenId,
  ethers.parseEther("1.0"), // price
  ethers.ZeroAddress // ETH payment
);
await tx.wait();
```

### 4. Buying an NFT

```javascript
// Get listing ID
const sellerListings = await marketplace.getSellerListings(sellerAddress);
const listingId = sellerListings[0];

// Buy NFT
const listing = await marketplace.getListing(listingId);
const tx = await marketplace.buyItem(listingId, {
  value: listing.price
});
await tx.wait();
```

---

## Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Ownable**: Access control for admin functions
- **SafeERC20**: Safe token transfer operations
- **Custom Errors**: Gas-efficient error handling
- **Input Validation**: Comprehensive parameter checking

---

## Fee Structure

### Marketplace Fees
- **Default**: 2.5% of sale price
- **Minimum Fee**: 0.001 ETH
- **Configurable**: Owner can adjust fees

### Creator Royalties
- **Range**: 0-10% (configurable per token)
- **Automatic**: Automatically paid on resale
- **Skip**: No royalty if creator = seller

### Deployment Fees
- **Collection Creation**: 0.01 ETH (configurable)
- **Purpose**: Prevent spam collections

---

## Testing

Comprehensive test suite includes:
- Unit tests for all contracts
- Integration tests for workflows
- Edge cases and error conditions
- Gas optimization tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NFTMarketplace.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

---

## Gas Optimization

- **Batch Operations**: Batch mint to reduce gas
- **Efficient Storage**: Packed structs
- **Custom Errors**: Instead of revert strings
- **View Functions**: For off-chain data queries

---

## Upgrade Strategy

Contracts are designed modularly for easy upgrades:
- **Fee Manager**: Can change fee logic
- **Factory**: Can deploy new versions
- **Marketplace**: Core logic can be upgraded

---

## Events

All contracts emit detailed events for:
- **Indexing**: Easy backend tracking
- **Frontend**: Real-time updates
- **Analytics**: Market insights

---

## Important Notes

1. **Mainnet Deployment**: Review all parameters before deploying
2. **Fee Recipients**: Set correct addresses for production
3. **Access Control**: Verify owner addresses
4. **Gas Limits**: Test with realistic data sizes
5. **Approval Flow**: Users must approve NFTs before listing

---

## Production Checklist

- [ ] Set production fee recipients
- [ ] Configure appropriate fees
- [ ] Set up multisig for contract ownership
- [ ] Verify all contracts on block explorer
- [ ] Test with small amounts first
- [ ] Monitor gas costs
- [ ] Set up event monitoring
- [ ] Prepare emergency procedures

---

## Support

If you encounter issues with contracts:
1. Check event logs
2. Verify contract state
3. Review transaction details
4. Contact development team

---

**Built with**:
- Solidity ^0.8.20
- OpenZeppelin Contracts v5.4.0
- Hardhat Development Environment
- TypeScript for scripts and tests

**Security**: All contracts follow best practices and are designed according to OpenZeppelin standards.
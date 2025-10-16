# NexArt NFT Marketplace Smart Contracts

Hệ thống smart contract hoàn chỉnh cho NFT marketplace được viết bằng Solidity với OpenZeppelin libraries.

## 🏗️ Kiến trúc hệ thống

### 1. **NFTCollection.sol**
- **Chức năng**: ERC-721 compliant NFT collection contract
- **Tính năng**:
  - Mint NFT với metadata URI và royalty
  - Batch mint multiple NFTs
  - Quản lý royalty cho từng token
  - Burn tokens
  - Pause/unpause functionality
  - Collection metadata management

### 2. **NFTCollectionFactory.sol**  
- **Chức năng**: Factory contract để deploy NFT collections
- **Tính năng**:
  - Deploy collection mới cho creators
  - Tracking all collections và creators
  - Deployment fee management
  - Maximum collections per creator limit
  - Emergency controls

### 3. **Marketplace.sol**
- **Chức năng**: Central marketplace cho NFT trading
- **Tính năng**:
  - List NFTs for sale (ETH và ERC20 tokens)
  - Buy NFTs với automatic fee distribution
  - Cancel listings
  - Update listing prices
  - Royalty support cho creators
  - Paginated queries
  - Emergency controls

### 4. **MarketplaceFeeManager.sol**
- **Chức năng**: Centralized fee management
- **Tính năng**:
  - Configurable marketplace fees
  - Minimum fee enforcement
  - Fee recipient management
  - Fee calculation utilities

## 🛠️ Setup và Deployment

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

# Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost
```

### Deploy using Ignition
```bash
npx hardhat ignition deploy ignition/modules/NFTMarketplace.ts --network localhost
```

## 📋 Contract Addresses (after deployment)

Sau khi deploy, các địa chỉ contract sẽ được hiển thị. Lưu lại để sử dụng trong frontend/backend.

## 🎯 Usage Examples

### 1. Tạo NFT Collection

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

### 2. Mint NFT

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

### 3. List NFT trên Marketplace

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

### 4. Buy NFT

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

## 🔐 Security Features

- **ReentrancyGuard**: Bảo vệ khỏi reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Ownable**: Access control cho admin functions
- **SafeERC20**: Safe token transfers
- **Custom Errors**: Gas-efficient error handling
- **Input Validation**: Comprehensive parameter checking

## 💰 Fee Structure

### Marketplace Fees
- **Default**: 2.5% của giá bán
- **Minimum Fee**: 0.001 ETH
- **Configurable**: Owner có thể thay đổi

### Creator Royalties
- **Range**: 0-10% (configurable per token)
- **Automatic**: Tự động trả royalty khi bán lại
- **Skip**: Không trả royalty nếu creator = seller

### Deployment Fees
- **Collection Creation**: 0.01 ETH (configurable)
- **Purpose**: Prevent spam collections

## 🧪 Testing

Comprehensive test suite bao gồm:
- Unit tests cho tất cả contracts
- Integration tests cho workflows
- Edge cases và error conditions
- Gas optimization tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NFTMarketplace.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

## 📊 Gas Optimization

- **Batch Operations**: Batch mint để giảm gas
- **Efficient Storage**: Packed structs
- **Custom Errors**: Thay vì revert strings
- **View Functions**: Để query data off-chain

## 🔄 Upgrade Strategy

Contracts được thiết kế modular để dễ upgrade:
- **Fee Manager**: Có thể thay đổi logic fees
- **Factory**: Có thể deploy versions mới
- **Marketplace**: Core logic có thể upgrade

## 📝 Events

Tất cả contracts emit detailed events cho:
- **Indexing**: Easy backend tracking
- **Frontend**: Real-time updates
- **Analytics**: Market insights

## ⚠️ Important Notes

1. **Mainnet Deployment**: Review all parameters trước khi deploy
2. **Fee Recipients**: Set correct addresses cho production
3. **Access Control**: Verify owner addresses
4. **Gas Limits**: Test với realistic data sizes
5. **Approval Flow**: Users phải approve NFTs trước khi list

## 🎯 Production Checklist

- [ ] Set production fee recipients
- [ ] Configure appropriate fees
- [ ] Set up multisig for contract ownership
- [ ] Verify all contracts on block explorer
- [ ] Test with small amounts first
- [ ] Monitor gas costs
- [ ] Set up event monitoring
- [ ] Prepare emergency procedures

## 📞 Support

Nếu có vấn đề với contracts:
1. Check event logs
2. Verify contract state
3. Review transaction details
4. Contact development team

---

**⚡ Built with**:
- Solidity ^0.8.20
- OpenZeppelin Contracts v5.4.0
- Hardhat Development Environment
- TypeScript for scripts and tests

**🔒 Security**: All contracts follow best practices và đã được designed theo OpenZeppelin standards.
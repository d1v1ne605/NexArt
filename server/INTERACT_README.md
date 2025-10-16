# 🎨 NexArt NFT Marketplace Console Interface

Script tương tác với các smart contract đã deploy của NexArt NFT Marketplace thông qua giao diện console với menu interaktif.

## 📋 Tính năng chính

### 🏭 1. NFT Collection Factory Operations
- **Tạo Collection mới** với dữ liệu ngẫu nhiên (tên, symbol, description, max supply)
- **Xem tất cả Collections** đã được tạo
- **Xem Collections của Creator** cụ thể
- **Thống kê Factory** (tổng số collection, phí deploy, v.v.)

### 🎨 2. NFT Collection Operations  
- **Mint NFT** với metadata ngẫu nhiên và royalty ngẫu nhiên
- **Batch Mint NFTs** (mint nhiều NFT cùng lúc)
- **Xem thống kê Collection** (total supply, creator, description, v.v.)
- **Xem thông tin Token** cụ thể (owner, creator, URI, royalty)
- **Set Royalty** cho token với giá trị ngẫu nhiên

### 🛒 3. Marketplace Operations
- **List NFT để bán** với giá ngẫu nhiên (0.01-2.0 ETH)
- **Mua NFT** đã được list
- **Hủy listing**
- **Cập nhật giá** listing với giá ngẫu nhiên mới
- **Xem tất cả listings** đang hoạt động
- **Xem listings của bạn**

### 💰 4. Fee Manager Operations
- **Xem thông tin phí** marketplace (fee %, recipient, minimum fee)
- **Tính phí** cho một giao dịch cụ thể
- **Xem breakdown phí** chi tiết

## 🚀 Cách sử dụng

### Yêu cầu
- Node.js và npm đã được cài đặt
- Hardhat environment đã được setup
- Ganache hoặc local blockchain đang chạy trên port 7545
- Các contract đã được deploy

### Chạy script
```bash
cd server
npx hardhat run scripts/interact.ts --network ganache
```

### Cấu trúc Menu
```
📋 MAIN MENU
═══════════════════════════════════════════
1. 🏭 NFT Collection Factory Operations
2. 🎨 NFT Collection Operations  
3. 🛒 Marketplace Operations
4. 💰 Fee Manager Operations
5. 📊 View Account Information
0. ❌ Exit
```

## 🎲 Dữ liệu ngẫu nhiên

Script tự động generate các dữ liệu ngẫu nhiên:

### Collection Names
- "Mystic Dragons", "Golden Warriors", "Royal Gems", "Eternal Artifacts", v.v.

### Symbols  
- "MDG", "GWR", "RGM", "EAR", "LSP", "STL", "ADR", "DVT"

### Descriptions
- "A unique collection of digital art pieces"
- "Exclusive NFTs with mystical powers"
- "Rare collectibles from another dimension"
- v.v.

### Prices
- 0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0 ETH

### Token URIs
- `https://api.nexart.com/metadata/{randomId}.json`

### Royalties
- 0-5% (0-500 basis points)

### Max Supply
- 100-1100 tokens

## 📍 Contract Addresses

Script được cấu hình để sử dụng các contract addresses:

```typescript
const NFT_COLLECTION_FACTORY_ADDRESS = '0xBCd650aa5eF13115a3113e6D98B8ab8dB127beE1';
const MARKETPLACE_ADDRESS = '0xccc33E23199E1bD58f3cD9b8740539810a8a6a0c';
const MARKETPLACE_FEE_MANAGER_ADDRESS = '0xCD3e96AaE2B3BDaAb3B4893a67dF1580f051A20E';
```

**Lưu ý**: Cập nhật các addresses này nếu bạn deploy contracts mới.

## 🔧 Các tính năng chi tiết

### Factory Operations

#### 1. Tạo Collection mới
- Tự động generate tên, symbol, description ngẫu nhiên
- Max supply ngẫu nhiên từ 100-1100
- Tự động trả phí deployment
- Hiển thị contract address của collection mới

#### 2. Xem Collections
- Pagination support (hiển thị 10 collection đầu tiên)
- Thông tin creator, total supply, validation status

### Collection Operations

#### 1. Mint NFT
- Cần nhập collection address
- Token URI và royalty được generate ngẫu nhiên
- Hiển thị token ID sau khi mint thành công

#### 2. Batch Mint
- Mint 1-5 NFTs cùng lúc
- Tất cả NFTs có cùng royalty rate

### Marketplace Operations

#### 1. List NFT
- Cần có NFT trong ví
- **Quan trọng**: Phải approve marketplace trước khi list
- Giá được set ngẫu nhiên
- Chỉ hỗ trợ ETH payment

#### 2. Buy NFT
- Cần listing ID
- Tự động tính và trả các phí (market fee, royalty)
- Transfer NFT về ví buyer

## ⚠️ Lưu ý quan trọng

### 1. Approval trước khi List NFT
Trước khi list NFT, bạn cần approve marketplace contract:

```solidity
// Option 1: Approve specific token
await nftContract.approve(marketplaceAddress, tokenId);

// Option 2: Approve all tokens (recommended)  
await nftContract.setApprovalForAll(marketplaceAddress, true);
```

### 2. Đảm bảo đủ ETH
- Account cần đủ ETH để trả gas fees
- Khi tạo collection cần trả deployment fee
- Khi mua NFT cần đủ ETH theo giá listed

### 3. Network Configuration
Script được cấu hình cho Ganache network. Nếu sử dụng network khác, cập nhật trong `initializeContracts()`.

## 🎯 Use Cases

### Testing Smart Contracts
- Test các function của contract với dữ liệu ngẫu nhiên
- Kiểm tra gas consumption
- Verify event emission

### Demo/Presentation
- Showcase tính năng marketplace
- Tạo dữ liệu mẫu nhanh chóng
- Interactive demo cho client/investor

### Development
- Debug contract interactions
- Test edge cases với random data
- Quick prototyping

## 🛠️ Customization

### Thay đổi Random Data
Customize các function generate random data:
- `generateRandomName()`
- `generateRandomSymbol()`
- `generateRandomDescription()`
- `generateRandomPrice()`
- `generateRandomTokenURI()`

### Thêm tính năng mới
- Thêm menu items mới trong các `show*Menu()` functions
- Implement function tương ứng
- Update switch cases

### Network Configuration
Thay đổi network trong `initializeContracts()`:
```typescript
const { ethers: hreEthers } = await network.connect("sepolia"); // Thay "ganache"
```

## 📝 Troubleshooting

### Lỗi "Contract not found"
- Kiểm tra contract addresses
- Đảm bảo contracts đã được deploy
- Verify network đúng

### Lỗi "Insufficient funds"
- Kiểm tra ETH balance
- Đảm bảo đủ ETH cho gas fees

### Lỗi "Not approved"
- Approve marketplace contract trước khi list NFT
- Sử dụng `setApprovalForAll(marketplaceAddress, true)`

### Connection issues
- Đảm bảo Ganache đang chạy
- Kiểm tra port và RPC URL
- Verify network configuration

---

## 💡 Tips

1. **Sử dụng setApprovalForAll**: Approve toàn bộ thay vì từng token
2. **Test với small amounts**: Bắt đầu với giá trị nhỏ
3. **Monitor gas costs**: Theo dõi gas usage cho các operation
4. **Keep track of IDs**: Note lại collection addresses và token IDs
5. **Use account info**: Check balance thường xuyên

---

Enjoy building with NexArt NFT Marketplace! 🚀✨
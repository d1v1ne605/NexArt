# NexArt NFT Marketplace Console Interface

Interactive script for interacting with NexArt NFT Marketplace smart contracts through a console interface with interactive menu.

## Table of Contents

- [Main Features](#main-features)
- [Usage](#usage)
- [Random Data Generation](#random-data-generation)
- [Contract Addresses](#contract-addresses)
- [Detailed Features](#detailed-features)
- [Important Notes](#important-notes)
- [Use Cases](#use-cases)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Tips](#tips)

---

## Main Features

### 1. NFT Collection Factory Operations
- **Create New Collection** with random data (name, symbol, description, max supply)
- **View All Collections** created
- **View Creator Collections** for specific creator
- **Factory Statistics** (total collections, deployment fees, etc.)

### 2. NFT Collection Operations  
- **Mint NFT** with random metadata and royalty
- **Batch Mint NFTs** (mint multiple NFTs at once)
- **View Collection Statistics** (total supply, creator, description, etc.)
- **View Token Information** for specific token (owner, creator, URI, royalty)
- **Set Royalty** for token with random value

### 3. Marketplace Operations
- **List NFT for Sale** with random price (0.01-2.0 ETH)
- **Buy Listed NFT** 
- **Cancel Listing**
- **Update Listing Price** with new random price
- **View All Active Listings**
- **View Your Listings**

### 4. Fee Manager Operations
- **View Fee Information** marketplace (fee %, recipient, minimum fee)
- **Calculate Fees** for specific transaction
- **View Fee Breakdown** details

---

## Usage

### Requirements
- Node.js and npm installed
- Hardhat environment setup
- Ganache or local blockchain running on port 7545
- Contracts deployed

### Running the Script
```bash
cd server
npx hardhat run scripts/interact.ts --network ganache
```

### Menu Structure
```
MAIN MENU
═══════════════════════════════════════════
1. NFT Collection Factory Operations
2. NFT Collection Operations  
3. Marketplace Operations
4. Fee Manager Operations
5. View Account Information
0. Exit
```

---

## Random Data Generation

The script automatically generates random data:

### Collection Names
- "Mystic Dragons", "Golden Warriors", "Royal Gems", "Eternal Artifacts", etc.

### Symbols  
- "MDG", "GWR", "RGM", "EAR", "LSP", "STL", "ADR", "DVT"

### Descriptions
- "A unique collection of digital art pieces"
- "Exclusive NFTs with mystical powers"
- "Rare collectibles from another dimension"
- etc.

### Prices
- 0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0 ETH

### Token URIs
- `https://api.nexart.com/metadata/{randomId}.json`

### Royalties
- 0-5% (0-500 basis points)

### Max Supply
- 100-1100 tokens

---

## Contract Addresses

The script is configured to use these contract addresses:

```typescript
const NFT_COLLECTION_FACTORY_ADDRESS = '0xBCd650aa5eF13115a3113e6D98B8ab8dB127beE1';
const MARKETPLACE_ADDRESS = '0xccc33E23199E1bD58f3cD9b8740539810a8a6a0c';
const MARKETPLACE_FEE_MANAGER_ADDRESS = '0xCD3e96AaE2B3BDaAb3B4893a67dF1580f051A20E';
```

Note: Update these addresses if you deploy new contracts.

---

## Detailed Features

### Factory Operations

#### 1. Create New Collection
- Automatically generate random name, symbol, description
- Random max supply from 100-1100
- Automatically pay deployment fee
- Display new collection contract address

#### 2. View Collections
- Pagination support (display first 10 collections)
- Information: creator, total supply, validation status

### Collection Operations

#### 1. Mint NFT
- Requires collection address input
- Token URI and royalty randomly generated
- Display token ID after successful mint

#### 2. Batch Mint
- Mint 1-5 NFTs at once
- All NFTs share same royalty rate

### Marketplace Operations

#### 1. List NFT
- Requires NFT in wallet
- Important: Must approve marketplace before listing
- Price randomly set
- ETH payment only

#### 2. Buy NFT
- Requires listing ID
- Automatically calculate and pay fees (market fee, royalty)
- Transfer NFT to buyer wallet

---

## Important Notes

### 1. Approval Before Listing NFT
Before listing an NFT, you need to approve the marketplace contract:

```solidity
// Option 1: Approve specific token
await nftContract.approve(marketplaceAddress, tokenId);

// Option 2: Approve all tokens (recommended)  
await nftContract.setApprovalForAll(marketplaceAddress, true);
```

### 2. Ensure Sufficient ETH
- Account needs enough ETH for gas fees
- Creating collection requires paying deployment fee
- Buying NFT requires ETH according to listed price

### 3. Network Configuration
Script is configured for Ganache network. If using different network, update in `initializeContracts()`.

---

## Use Cases

### Testing Smart Contracts
- Test contract functions with random data
- Check gas consumption
- Verify event emission

### Demo/Presentation
- Showcase marketplace features
- Create sample data quickly
- Interactive demo for clients/investors

### Development
- Debug contract interactions
- Test edge cases with random data
- Quick prototyping

---

## Customization

### Change Random Data
Customize these random data generation functions:
- `generateRandomName()`
- `generateRandomSymbol()`
- `generateRandomDescription()`
- `generateRandomPrice()`
- `generateRandomTokenURI()`

### Add New Features
- Add new menu items in `show*Menu()` functions
- Implement corresponding function
- Update switch cases

### Network Configuration
Change network in `initializeContracts()`:
```typescript
const { ethers: hreEthers } = await network.connect("sepolia"); // Change "ganache"
```

---

## Troubleshooting

### Error: "Contract not found"
- Check contract addresses
- Ensure contracts are deployed
- Verify correct network

### Error: "Insufficient funds"
- Check ETH balance
- Ensure enough ETH for gas fees

### Error: "Not approved"
- Approve marketplace contract before listing NFT
- Use `setApprovalForAll(marketplaceAddress, true)`

### Connection issues
- Ensure Ganache is running
- Check port and RPC URL
- Verify network configuration

---

## Tips

1. Use setApprovalForAll: Approve all instead of individual tokens
2. Test with small amounts: Start with small values
3. Monitor gas costs: Track gas usage for operations
4. Keep track of IDs: Note collection addresses and token IDs
5. Use account info: Check balance regularly

---

Enjoy building with NexArt NFT Marketplace!
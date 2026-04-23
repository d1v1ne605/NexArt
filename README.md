# NexArt - Decentralized NFT Marketplace

**NexArt** is a comprehensive decentralized NFT marketplace platform that enables users to mint, buy, and sell digital assets on the blockchain.

## Video Demo

[![NexArt Demo](https://drive.google.com/file/d/1lt35oBQpXbqF_MDfiNJbwSkkbGYoaGmz/view?usp=drive_link)](https://drive.google.com/file/d/12BfeaC988rn1v4AqEvy0-9i-CZAFi_3j/view)

Watch a complete walkthrough of the NexArt platform showcasing the user interface, NFT collection creation, minting process, marketplace listings, and NFT purchasing.

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [System Requirements](#-system-requirements)
- [Installation Guide](#-installation-guide)
- [Environment Configuration](#-environment-configuration)
- [Running the Project](#-running-the-project)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Development Workflow](#-development-workflow)
- [Network Configuration](#-network-configuration)

---

## Overview

NexArt is a complete solution for building a decentralized NFT marketplace on EVM-compatible blockchains, including:

- **Smart Contracts**: Comprehensive smart contract system written in Solidity
- **Backend Server**: Node.js/Express API that interacts with blockchain
- **Subgraph**: The Graph indexing for efficient data querying
- **Real-time Notifications**: WebSocket-based notification system with Socket.IO
- **Event Listening**: Blockchain event monitoring and processing

### Key Objectives

✅ Provide a secure and reliable platform for NFT trading  
✅ Ensure low transaction fees and fast processing  
✅ Developer-friendly environment with comprehensive documentation  
✅ Real-time notifications and event tracking  

---

## Features

### Smart Contracts
- **NFT Collection Factory** - Create new NFT collections with configurable parameters
- **NFT Collection** - Mint, burn, and manage NFTs with royalty support
- **Marketplace** - List, buy, sell NFTs with automatic fee distribution
- **Fee Manager** - Centralized marketplace fee management
- **Access Control** - Role-based access control for secure operations
- **Gas Optimization** - Batch operations and efficient storage

### Backend Services
- **Event Listening** - Real-time blockchain event monitoring
- **Notification System** - Real-time notifications via Socket.IO
- **Scheduled Tasks** - Cron jobs for maintenance and digests
- **Algolia Integration** - Full-text search capabilities
- **Subgraph Polling** - Data synchronization from The Graph
- **Authentication** - JWT and Wallet-based authentication
- **Rate Limiting** - Protection against spam and abuse

### Supported Networks
- Local Development (Hardhat/Ganache)
- Sepolia Testnet
- EVM-compatible Chains (Ethereum, Polygon, BSC, Arbitrum, etc.)

---

## Architecture

```
NexArt/
├── server/                 # Backend & Smart Contracts
│   ├── contracts/          # Solidity smart contracts
│   ├── scripts/            # Deploy and interaction scripts
│   ├── src/                # Express backend code
│   ├── test/               # Smart contract tests
│   └── ignition/           # Hardhat Ignition modules
├── subgraph/               # The Graph indexing layer
│   └── nftmarketplace/     # NFT Marketplace subgraph
└── README.md              # This file
```

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Frontend (Next.js + Wagmi)             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│         Backend API (Node.js/Express)              │
│  - Event Listening                                 │
│  - Notifications (Socket.IO)                       │
│  - Scheduled Tasks (Cron)                          │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴───────────┐
        │                        │
┌───────▼──────────┐  ┌──────────▼────────┐
│ Smart Contracts  │  │ The Graph/Subgraph│
│ (Blockchain)     │  │ (Data Indexing)   │
└──────────────────┘  └───────────────────┘
```

---

## System Requirements

### Required
- **Node.js**: v18.0.0 or higher
- **npm/pnpm**: Package manager (recommended: pnpm v8+)
- **Git**: Version control system

### Optional (for Development)
- **Docker**: For running PostgreSQL & IPFS locally
- **Ganache/Hardhat**: Local blockchain development
- **MetaMask**: Wallet browser extension

### Verify Your Installation
```bash
node --version      # Should be v18.0.0 or higher
npm --version       # Should be 9.0.0 or higher
pnpm --version      # Should be 8.0.0 or higher (if using pnpm)
git --version       # Should be 2.40.0 or higher
```

---

## Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/d1v1ne605/NexArt.git
cd NexArt
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd server
pnpm install

# Install subgraph dependencies (optional)
cd ../subgraph/nftmarketplace
pnpm install
```

### Step 3: Configure Environment

See the [Environment Configuration](#-environment-configuration) section below.

### Step 4: Compile Smart Contracts

```bash
cd server
npx hardhat compile
```

### Step 5: Deploy Smart Contracts (Local Development)

```bash
# Start local blockchain node
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.ts --network localhost

# Or use Hardhat Ignition
npx hardhat ignition deploy ignition/modules/NFTMarketplace.ts --network localhost
```

---

## Environment Configuration

### Backend Configuration (.env)

Copy the example file and customize for your environment:

```bash
cd server
cp .env.example .env
```

**Required environment variables:**

```env
# ============ Server Configuration ============
PORT=8080
NODE_ENV=development

# ============ Blockchain Configuration ============
RPC_URL=http://localhost:8545
PRIVATE_KEY=0x...
NETWORK=localhost

# ============ Smart Contract Addresses ============
MARKETPLACE_ADDRESS=0x...
NFT_COLLECTION_FACTORY_ADDRESS=0x...
MARKETPLACE_FEE_MANAGER_ADDRESS=0x...

# ============ Database Configuration ============
DEV_DB_HOST=localhost
DEV_DB_PORT=3306
DEV_DB_NAME=nexart_db
DEV_DB_USERNAME=nexart_user
DEV_DB_PASSWORD=your_password

# ============ Client Configuration ============
CLIENT_URL=http://localhost:3000

# ============ Authentication ============
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
SESSION_SECRET=your_session_secret

# ============ Cron Jobs Configuration ============
ENABLE_CRON_JOBS=true
TIMEZONE=UTC
ENABLE_DAILY_DIGEST=true

# ============ Algolia Search Configuration ============
ALGOLIA_APP_ID=your_app_id
ALGOLIA_WRITE_API_KEY=your_write_key
ALGOLIA_NFT_INDEX_NAME=nfts_index

# ============ IPFS/Pinata Configuration ============
PINATA_GATEWAY_TOKEN=your_gateway_token

# ============ Subgraph Configuration ============
SUBGRAPH_URL=http://localhost:8000/subgraphs/name/nftmarketplace
SUBGRAPH_POLL_INTERVAL=5000

# ============ Rate Limiting ============
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Subgraph Configuration (.env in `subgraph/nftmarketplace/`)

```env
# Network and Node Configuration
NETWORK=localhost
GRAPH_NODE_URL=http://localhost:8020
IPFS_URL=http://localhost:5001

# Contract Addresses (update after deployment)
MARKETPLACE_ADDRESS=0x...
NFT_COLLECTION_FACTORY_ADDRESS=0x...
MARKETPLACE_FEE_MANAGER_ADDRESS=0x...

# Block Numbers
MARKETPLACE_BLOCK=0
NFT_COLLECTION_FACTORY_BLOCK=0
MARKETPLACE_FEE_MANAGER_BLOCK=0
```

---

## Running the Project

### Backend Development Mode

```bash
cd server

# Start development server with hot reload
pnpm dev

# Server will run on http://localhost:8080
```

### Backend Production Mode

```bash
cd server

# Build and start
pnpm start
```

### Running Tests

```bash
cd server

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NFTMarketplace.ts

# Run with gas report
REPORT_GAS=true npx hardhat test
```

### Interactive Contract Console

```bash
cd server

# Launch interactive console menu
npx hardhat run scripts/interact.ts --network localhost
```

### Subgraph Development (Optional)

```bash
cd subgraph/nftmarketplace

# Install The Graph CLI globally
npm install -g @graphprotocol/graph-cli

# Start local Graph node (requires Docker)
docker-compose up -d

# Generate types from schema
npm run codegen

# Build subgraph
npm run build

# Create local subgraph
npm run create-local

# Deploy to local node
npm run deploy-local
```

### Running with Docker (Optional)

```bash
# Start all services (PostgreSQL, IPFS, Graph Node)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Project Structure

### Backend (`server/`)

```
server/
├── contracts/                    # Smart Contracts (Solidity)
│   ├── Marketplace.sol          # Main marketplace contract
│   ├── NFTCollection.sol        # ERC-721 NFT contract
│   ├── NFTCollectionFactory.sol # Factory for creating collections
│   ├── MarketplaceFeeManager.sol# Centralized fee management
│   └── Counter.sol              # Example contract
│
├── scripts/
│   ├── deploy.ts               # Contract deployment script
│   ├── deploy-test.ts          # Test deployment
│   ├── interact.ts             # Interactive console
│   └── call-inc.ts             # Call contract functions
│
├── src/                        # Backend Application Code
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   │   ├── config.common.js  # Common config
│   │   ├── config.mysql.js   # Database config
│   │   └── passport.js       # Authentication setup
│   ├── routes/                # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── user/             # User endpoints
│   │   ├── notifications/    # Notification endpoints
│   │   ├── favorite/         # Favorites endpoints
│   │   └── health/           # Health check
│   ├── models/                # Database models (Sequelize)
│   │   ├── user.model.js
│   │   ├── notification.model.js
│   │   ├── userNftFavorites.model.js
│   │   └── walletNonce.model.js
│   ├── service/               # Business logic
│   │   ├── notification.service.js
│   │   ├── socket.service.js
│   │   ├── contractEventListener.service.js
│   │   ├── subgraphPolling.service.js
│   │   ├── cronJob.service.js
│   │   └── algolia.service.js
│   ├── controller/            # Request handlers
│   ├── middleware/            # Express middleware
│   └── utils/                 # Utility functions
│
├── test/                      # Smart contract tests
│   ├── Counter.ts
│   └── NFTMarketplace.ts
│
├── ignition/modules/          # Hardhat Ignition deployment modules
│   ├── Counter.ts
│   └── NFTMarketplace.ts
│
├── public/                    # Static files
│   └── notification-test.html
│
├── hardhat.config.ts          # Hardhat configuration
├── tsconfig.json
└── package.json
```

### Subgraph (`subgraph/nftmarketplace/`)

```
subgraph/nftmarketplace/
├── src/                       # TypeScript mapping files
│   ├── marketplace.ts        # Marketplace event handlers
│   ├── nft-collection.ts     # NFT collection handlers
│   ├── nft-collection-factory.ts  # Factory handlers
│   └── marketplace-fee-manager.ts  # Fee manager handlers
│
├── abis/                     # Contract ABIs
│   ├── Marketplace.json
│   ├── NFTCollection.json
│   ├── NFTCollectionFactory.json
│   └── MarketplaceFeeManager.json
│
├── schema.graphql            # GraphQL schema definition
├── subgraph.yaml            # Subgraph manifest
├── tsconfig.json
└── package.json
```

---

## Documentation

Comprehensive documentation is available in dedicated README files:

| Document | Purpose |
|----------|---------|
| [SMART_CONTRACTS_README.md](./server/SMART_CONTRACTS_README.md) | Smart contract architecture, setup, and testing |
| [INTERACT_README.md](./server/INTERACT_README.md) | Interactive contract interaction guide |
| [EVENT_SYSTEM_README.md](./server/EVENT_SYSTEM_README.md) | Blockchain event listening and processing |
| [subgraph/nftmarketplace/QUERIES_EXAMPLE.md](./subgraph/nftmarketplace/QUERIES_EXAMPLE.md) | GraphQL query examples |

---

## Development Workflow

### 1. Smart Contract Development

```bash
cd server

# Edit contracts in contracts/ directory
# Run tests to validate
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

### 2. Backend API Development

```bash
cd server

# Edit code in src/ directory
# Server automatically reloads via nodemon
pnpm dev

# Test endpoints
curl http://localhost:8080/api/health
```

### 3. Subgraph Development

```bash
cd subgraph/nftmarketplace

# Edit mapping files in src/
npm run codegen
npm run build
npm run deploy-local

# Test queries at http://localhost:8000/graphql
```

### 4. Integration Testing

```bash
# 1. Start local blockchain
npx hardhat node

# 2. Deploy contracts in another terminal
npx hardhat run scripts/deploy.ts --network localhost

# 3. Start backend
pnpm dev

# 4. Run tests and validation
npx hardhat test
```

---

## Network Configuration

### Local Development

```bash
# Option 1: Hardhat Local Node (default on port 8545)
npx hardhat node

# Option 2: Ganache CLI
ganache-cli -p 7545
```

### Sepolia Testnet

```bash
# Set SEPOLIA_PRIVATE_KEY in .env
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on block explorer
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Production (Mainnet)

⚠️ **IMPORTANT**: Only deploy after thorough testing on testnet!

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

### Custom Networks

Edit `hardhat.config.ts` to add more networks:

```typescript
networks: {
  custom: {
    url: "https://rpc-url.com",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 1234
  }
}
```
# Event Listening System

Hybrid Event Listening System that combines blockchain listeners and subgraph polling for comprehensive event coverage.

## Table of Contents

- [Architecture](#architecture)
- [Components](#components)
- [Workflow](#workflow)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Server Restart Solution](#server-restart-solution)
- [Logs](#logs)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
Event Listener Manager
  |-- Contract Event Listener
  |    |-- Factory events
  |    |-- Marketplace events
  |    |-- Metadata fetching
  |    |-- Real-time blockchain
  |
  |-- Subgraph Polling Service
  |    |-- TokenMinted
  |    |-- Transfer
  |    |-- CollectionInfoUpdated
  |    |-- Polling subgraph every 5s
  |
  V
  Algolia Index
    |-- NFTs
    |-- Collections
```

---

## Components

### 1. ContractEventListener (Real-time Blockchain)
- **Purpose**: Listen to critical events requiring immediate response
- **Events Monitored**:
  - `CollectionCreated` (from Factory)
  - `ItemListed` (from Marketplace)
- **Responsibilities**:
  - Process events in real-time
  - Provide metadata fetching for SubgraphPollingService
  - Manage contract instances

### 2. SubgraphPollingService (Subgraph Polling)
- **Purpose**: Listen to collection events through subgraph
- **Events Processed**:
  - `TokenMinted` (from NFT Collections)
  - `Transfer` (from NFT Collections)
  - `CollectionInfoUpdated` (from NFT Collections)
- **Responsibilities**:
  - Poll subgraph every 5 seconds
  - Track processed events to avoid duplicates
  - Update Algolia index

### 3. EventListenerManager
- **Purpose**: Overall management of both systems
- **Responsibilities**:
  - Initialize and coordinate
  - Provide unified interface
  - Graceful shutdown

---

## Workflow

### Server Startup
1. `EventListenerManager.init()`
2. `ContractEventListener.init()` - Connect to blockchain
3. `SubgraphPollingService.init()` - Connect to subgraph
4. `EventListenerManager.startAll()`
5. Start blockchain listeners for Factory & Marketplace
6. Start subgraph polling for NFT events

### Event Processing Flow
```
Factory Event (Real-time)
├── CollectionCreated
├── Update Algolia collections index
└── Start listeners for new collection

NFT Event (Subgraph polling)
├── TokenMinted/Transfer/CollectionInfoUpdated
├── Fetch metadata from ContractEventListener
└── Update Algolia NFTs index
```

---

## Configuration

### Environment Variables

```bash
# Subgraph Configuration
SUBGRAPH_URL=http://localhost:8000/subgraphs/name/nftmarketplace
SUBGRAPH_POLL_INTERVAL=5000

# Blockchain Configuration
RPC_URL=your_rpc_url
MARKETPLACE_ADDRESS=0x...
NFT_COLLECTION_FACTORY_ADDRESS=0x...

# Algolia Configuration
ALGOLIA_APP_ID=your_app_id
ALGOLIA_WRITE_API_KEY=your_key
ALGOLIA_NFT_INDEX_NAME=nfts_index
ALGOLIA_COLLECTION_INDEX_NAME=collections_index
```

---

## API Endpoints

### GET `/api/events/status`
Check the status of event listening system

**Response:**
```json
{
  "success": true,
  "data": {
    "isInitialized": true,
    "blockchain": {
      "isListening": true,
      "activeListeners": ["CollectionCreated", "ItemListed"],
      "marketplaceAddress": "0x...",
      "factoryAddress": "0x...",
      "description": "Handles Factory & Marketplace events + metadata fetching"
    },
    "subgraph": {
      "isPolling": true,
      "lastProcessedBlock": 12345,
      "processedEventsCount": 150,
      "subgraphUrl": "http://localhost:8000/subgraphs/name/nftmarketplace",
      "description": "Polls for TokenMinted, Transfer, CollectionInfoUpdated"
    },
    "summary": {
      "totalActiveListeners": 2,
      "isSubgraphPolling": true,
      "lastPolledBlock": 12345,
      "processedEvents": 150
    }
  }
}
```

### POST `/api/events/restart`
Restart the entire event listening system

### POST `/api/events/start`
Start the event listening system

### POST `/api/events/stop`
Stop the event listening system

---

## Server Restart Solution

### Previous Problem
- Server restart caused loss of NFT collection listeners
- Could only listen to new collections created after restart

### New Solution
- Subgraph has indexed all collections and events
- Polling subgraph automatically recovers listeners
- No loss of event tracking on restart

---

## Logs

### Startup Logs
```
Initializing Event Listener Manager...
Connected to network: Hardhat (chainId: 31337)
Marketplace contract initialized at: 0x...
NFT Collection Factory initialized at: 0x...
Subgraph polling service initialized: http://localhost:8000/subgraphs/name/nftmarketplace
Subgraph connected successfully at block 12345
Starting polling from block: 12335
Event Listener Manager initialized successfully
Starting all event systems...
CollectionCreated listener started
ItemListed listener started
Starting subgraph polling...
All event systems started successfully
Blockchain listeners: Factory, Marketplace
Subgraph polling: TokenMinted, Transfer, CollectionInfoUpdated
```

### Event Processing Logs
```
Found 3 new events from subgraph
Processing TokenMinted event from subgraph: 0x123...
Processing TokenMinted from subgraph...
Basic NFT Data: { tokenURI: "QmAbc...", owner: "0x456...", ... }
TokenMinted from subgraph processed successfully
```

---

## Troubleshooting

### Cannot Connect to Subgraph
- Check `SUBGRAPH_URL`
- Ensure subgraph is running: `docker ps` or `graph-node` status
- Verify network connectivity to subgraph endpoint

### Blockchain Listeners Not Working
- Check `RPC_URL`
- Verify contract addresses
- Check network connection
- Ensure blockchain node is accessible

### Duplicate Events
- System automatically deduplicates based on transaction hash + event ID
- Check processed events count in status endpoint
- Monitor for unusual event patterns

### Performance Issues
- Adjust `SUBGRAPH_POLL_INTERVAL` (default: 5000ms)
- Monitor processed events count
- Check Algolia rate limits
- Review server logs for bottlenecks
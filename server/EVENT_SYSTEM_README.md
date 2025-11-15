# Event Listening System

Hệ thống lắng nghe sự kiện lai (Hybrid Event Listening System) kết hợp cả blockchain listeners và subgraph polling.

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Listener Manager                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────────┐│
│  │ Contract Event Listener │  │ Subgraph Polling Service    ││
│  │                         │  │                             ││
│  │ • Factory events        │  │ • TokenMinted               ││
│  │ • Marketplace events    │  │ • Transfer                  ││
│  │ • Metadata fetching     │  │ • CollectionInfoUpdated     ││
│  │                         │  │                             ││
│  │ Real-time blockchain    │  │ Polling subgraph every 5s   ││
│  └─────────────────────────┘  └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Algolia Index  │
                     │                 │
                     │ • NFTs          │
                     │ • Collections   │
                     └─────────────────┘
```

## Thành phần

### 1. ContractEventListener (Real-time Blockchain)
- **Mục đích**: Lắng nghe events quan trọng cần response ngay lập tức
- **Events được lắng nghe**:
  - `CollectionCreated` (từ Factory)
  - `ItemListed` (từ Marketplace)
- **Nhiệm vụ**:
  - Xử lý events real-time
  - Cung cấp metadata fetching cho SubgraphPollingService
  - Quản lý contract instances

### 2. SubgraphPollingService (Subgraph Polling)
- **Mục đích**: Lắng nghe collection events thông qua subgraph
- **Events được xử lý**:
  - `TokenMinted` (từ NFT Collections)
  - `Transfer` (từ NFT Collections)
  - `CollectionInfoUpdated` (từ NFT Collections)
- **Nhiệm vụ**:
  - Poll subgraph mỗi 5 giây
  - Track processed events để tránh duplicate
  - Cập nhật Algolia index

### 3. EventListenerManager
- **Mục đích**: Quản lý tổng thể cả 2 hệ thống
- **Nhiệm vụ**:
  - Khởi tạo và điều phối
  - Cung cấp unified interface
  - Graceful shutdown

## Workflow

### Server Start
1. `EventListenerManager.init()`
2. `ContractEventListener.init()` - Kết nối blockchain
3. `SubgraphPollingService.init()` - Kết nối subgraph
4. `EventListenerManager.startAll()`
5. Start blockchain listeners cho Factory & Marketplace
6. Start subgraph polling cho NFT events

### Event Processing
```
Factory Event (Real-time)
├── CollectionCreated
├── Update Algolia collections index
└── Start listeners cho collection mới

NFT Event (Subgraph polling)
├── TokenMinted/Transfer/CollectionInfoUpdated
├── Fetch metadata từ ContractEventListener
└── Update Algolia NFTs index
```

## Configuration

### Environment Variables

```bash
# Subgraph
SUBGRAPH_URL=http://localhost:8000/subgraphs/name/nftmarketplace
SUBGRAPH_POLL_INTERVAL=5000

# Blockchain
RPC_URL=your_rpc_url
MARKETPLACE_ADDRESS=0x...
NFT_COLLECTION_FACTORY_ADDRESS=0x...

# Algolia
ALGOLIA_APP_ID=your_app_id
ALGOLIA_WRITE_API_KEY=your_key
ALGOLIA_NFT_INDEX_NAME=nfts_index
ALGOLIA_COLLECTION_INDEX_NAME=collections_index
```

## API Endpoints

### GET `/api/events/status`
Kiểm tra trạng thái hệ thống event listening

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
Restart toàn bộ hệ thống event listening

### POST `/api/events/start`
Start hệ thống event listening

### POST `/api/events/stop`
Stop hệ thống event listening

## Giải quyết vấn đề restart server

### Vấn đề cũ:
- Server restart → mất listeners của NFT collections cũ
- Chỉ listen được collections mới tạo sau khi restart

### Giải pháp mới:
- Subgraph đã index tất cả collections + events
- Polling subgraph → tự động phục hồi listeners
- Không bị mất track events khi restart

## Logs

### Startup Logs
```
🚀 Initializing Event Listener Manager...
🔗 Connected to network: Hardhat (chainId: 31337)
📋 Marketplace contract initialized at: 0x...
🏭 NFT Collection Factory initialized at: 0x...
📊 Subgraph polling service initialized: http://localhost:8000/subgraphs/name/nftmarketplace
✅ Subgraph connected successfully at block 12345
📍 Starting polling from block: 12335
✅ Event Listener Manager initialized successfully
🚀 Starting all event systems...
✅ CollectionCreated listener started
✅ ItemListed listener started
🔄 Starting subgraph polling...
✅ All event systems started successfully
📊 Blockchain listeners: Factory, Marketplace
🔄 Subgraph polling: TokenMinted, Transfer, CollectionInfoUpdated
```

### Event Processing Logs
```
📨 Found 3 new events from subgraph
📨 Processing TokenMinted event from subgraph: 0x123...
🎨 Processing TokenMinted from subgraph...
📦 Basic NFT Data: { tokenURI: "QmAbc...", owner: "0x456...", ... }
✅ TokenMinted from subgraph processed successfully
```

## Troubleshooting

### Subgraph không kết nối được
- Kiểm tra `SUBGRAPH_URL`
- Đảm bảo subgraph đang chạy: `docker ps` hoặc `graph-node` status

### Blockchain listeners không hoạt động
- Kiểm tra `RPC_URL`
- Verify contract addresses
- Check network connection

### Events bị duplicate
- System tự động deduplication based on transaction hash + event ID
- Check processed events count trong status

### Performance issues
- Điều chỉnh `SUBGRAPH_POLL_INTERVAL`
- Monitor processed events count
- Check Algolia rate limits
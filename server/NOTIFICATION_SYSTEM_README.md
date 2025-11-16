# 🔔 NexArt Notification System

A comprehensive realtime notification system for the NexArt NFT marketplace, built with Socket.IO, Node.js, and MySQL.

## 📋 Features

### Core Notification Features
- **Realtime Push Notifications** - Instant delivery via WebSocket
- **Multiple Notification Types** - NFT sales, listings, bids, welcomes, etc.
- **Persistent Storage** - All notifications stored in MySQL database
- **Read/Unread Status** - Track notification read status with realtime updates
- **Rich Metadata** - Store additional data (NFT details, transaction hashes, etc.)
- **Expiration Support** - Auto-cleanup of expired notifications

### Blockchain Integration
- **Smart Contract Events** - Listen to marketplace contract events
- **NFT Listing Notifications** - Notify when NFTs are listed for sale
- **Sale Notifications** - Notify both buyer and seller on successful sales
- **Bid Notifications** - Notify owners when bids are placed
- **Transaction Tracking** - Link notifications to blockchain transactions

### Realtime Features
- **Socket.IO Integration** - Bidirectional realtime communication
- **User Presence** - Track online/offline status
- **Room-based Broadcasting** - Targeted notifications to specific users
- **Authentication** - JWT-based socket authentication
- **Connection Management** - Handle multiple connections per user

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Blockchain    │    │   Notification   │    │   Socket.IO     │
│   Event         │───▶│   Service        │───▶│   Service       │
│   Listener      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │   MySQL          │    │   Connected     │
         └─────────────▶│   Database       │    │   Clients       │
                        │   (Persistent)   │    │   (Realtime)    │
                        └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment variables from `.env.example`:

```bash
# Socket.IO & Realtime Configuration
CLIENT_URL=http://localhost:3000

# Blockchain Configuration  
ENABLE_CONTRACT_LISTENER=true
MARKETPLACE_ADDRESS=0x...
RPC_URL=http://localhost:8545

# Cron Jobs
ENABLE_CRON_JOBS=true
TIMEZONE=UTC
```

### 2. Start the Server

```bash
npm run dev
```

The server will initialize:
- Socket.IO server on the same port as HTTP server
- Contract event listeners (if enabled)
- Cron jobs for cleanup tasks
- Database models and relationships

### 3. Test Notifications

Visit `http://localhost:8080/notification-test.html` to test the notification system with a web interface.

## 🔧 API Endpoints

### Notification Management

```javascript
// Get user notifications
GET /v1/api/notifications?page=1&limit=20&unreadOnly=true

// Get unread count
GET /v1/api/notifications/unread-count

// Mark notification as read
PUT /v1/api/notifications/:id/read

// Mark all as read
PUT /v1/api/notifications/read-all

// Delete notification
DELETE /v1/api/notifications/:id

// Send test notification (dev only)
POST /v1/api/notifications/test
```

### Example Response

```json
{
  "status": "success",
  "message": "Notifications retrieved successfully",
  "metadata": {
    "notifications": [
      {
        "id": "uuid-here",
        "type": "nft_listed",
        "title": "NFT Listed for Sale",
        "message": "Your NFT has been listed for 2.5 ETH",
        "data": {
          "nft_contract": "0x...",
          "token_id": "123",
          "price": "2.5",
          "listing_id": "456"
        },
        "tx_hash": "0x...",
        "is_read": false,
        "created_at": "2024-11-06T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 87,
      "per_page": 20
    }
  }
}
```

## 🌐 Socket.IO Events

### Client-to-Server Events

```javascript
// Authentication (required)
socket.auth = { token: 'your-jwt-token' };

// Join/leave notification room
socket.emit('join:notifications');
socket.emit('leave:notifications');

// Mark notifications as read
socket.emit('notification:mark_read', { notificationId: 'uuid' });
socket.emit('notification:mark_all_read');

// User presence
socket.emit('presence:update', 'online'); // 'online', 'away', 'busy', 'offline'
```

### Server-to-Client Events

```javascript
// Connection status
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// New notifications
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
  displayNotification(notification);
});

// Unread count updates
socket.on('notification:unread_count', ({ unreadCount }) => {
  updateBadge(unreadCount);
});

// Global broadcasts
socket.on('notification:global', (notification) => {
  console.log('Global notification:', notification);
});

// User presence updates
socket.on('presence:user_online', ({ userId }) => {
  console.log(`User ${userId} is online`);
});

socket.on('presence:user_offline', ({ userId }) => {
  console.log(`User ${userId} is offline`);
});
```

## 🎯 Notification Types

| Type | Description | Triggered By |
|------|-------------|--------------|
| `nft_listed` | NFT listed for sale | ItemListed blockchain event |
| `nft_sold` | NFT successfully sold | ItemSold blockchain event |
| `nft_bought` | NFT purchased | ItemSold blockchain event |
| `bid_received` | New bid on NFT | BidPlaced blockchain event |
| `bid_accepted` | Bid accepted | BidAccepted blockchain event |
| `bid_rejected` | Bid rejected | BidRejected blockchain event |
| `price_drop` | NFT price decreased | Price update logic |
| `auction_started` | Auction began | Auction creation |
| `auction_ending` | Auction ending soon | Scheduled job |
| `welcome` | Welcome new user | User registration |
| `achievement` | Achievement unlocked | User activity |

## 🔄 Integration Examples

### Creating Custom Notifications

```javascript
import notificationService from './service/notification.service.js';

// Create and send notification
const notification = await notificationService.createAndSendNotification({
  user_id: 'user-uuid',
  type: 'nft_listed',
  title: 'NFT Listed Successfully',
  message: 'Your NFT "Cool Art #123" is now live on the marketplace',
  data: {
    nft_contract: '0x...',
    token_id: '123',
    price: '2.5',
    currency: 'ETH'
  },
  tx_hash: '0x...' // Optional
});
```

### Listening to Smart Contract Events

```javascript
// Automatically integrated in ContractEventListener
// Events are processed and notifications created automatically

// Manual event processing
await contractEventListener.processItemListedEvent({
  listingId: '123',
  seller: '0x...',
  nftContract: '0x...',
  tokenId: '456',
  price: '2.5',
  transactionHash: '0x...'
});
```

### Frontend Integration

```javascript
// Initialize socket connection
const socket = io('http://localhost:8080', {
  auth: { token: localStorage.getItem('jwt') }
});

// Handle notifications
socket.on('notification:new', (notification) => {
  // Show toast notification
  showToast(notification.title, notification.message);
  
  // Update unread count
  updateNotificationBadge();
  
  // Play sound (optional)
  playNotificationSound();
});

// Join notifications room
socket.emit('join:notifications');
```

## 🧹 Maintenance

### Automatic Cleanup

Expired notifications are automatically cleaned up via cron job:

```javascript
// Runs every hour (configurable)
cron.schedule('0 * * * *', async () => {
  await notificationService.cleanupExpiredNotifications();
});
```

### Manual Cleanup

```javascript
// Trigger manual cleanup
const deletedCount = await notificationService.cleanupExpiredNotifications();
console.log(`Cleaned up ${deletedCount} expired notifications`);
```

## 🔒 Security

### JWT Authentication
- All socket connections require valid JWT tokens
- Tokens are verified on connection and stored in socket session
- Users can only access their own notifications

### Rate Limiting
- API endpoints are rate-limited
- Socket events have built-in throttling
- Abuse protection via connection limits

### Data Validation
- All notification data is validated before storage
- SQL injection protection via Sequelize ORM
- XSS protection for notification content

## 📊 Monitoring

### Service Status

```javascript
// Check notification service status
const status = {
  socket: socketService.getStatus(),
  notifications: notificationService.getStatus(),
  cronJobs: cronJobService.getJobsStatus()
};
```

### Metrics to Monitor

- Active socket connections
- Notification delivery rate
- Database query performance
- Failed notification attempts
- Cleanup job execution

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Enable SSL/TLS for Socket.IO
- [ ] Set up database connection pooling
- [ ] Configure Redis for session storage (optional)
- [ ] Enable cron jobs: `ENABLE_CRON_JOBS=true`
- [ ] Set appropriate timezone: `TIMEZONE=UTC`
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

### Docker Support

```dockerfile
# Add to your Dockerfile
EXPOSE 8080
ENV NODE_ENV=production
ENV ENABLE_CRON_JOBS=true
```

## 🤝 Contributing

1. Follow the established patterns for new notification types
2. Add proper error handling and logging
3. Include tests for new functionality
4. Update documentation for API changes
5. Follow security best practices

## 📝 License

This notification system is part of the NexArt project and follows the same license terms.
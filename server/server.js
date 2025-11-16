import app from './src/app.js'
import config from './src/config/config.common.js';
import socketService from './src/service/socket.service.js';
import notificationService from './src/service/notification.service.js';
import cronJobService from './src/service/cronJob.service.js';
import eventListenerManager from './src/service/eventListenerManager.service.js';

const PORT = process.env.PORT || 8080
const server = app.listen(PORT, () => {
    console.log(`
            🚀 Server is running!
            📍 Port: ${PORT}
            🌍 Environment: ${config.nodeEnv}
            🔗 Local: http://localhost:${PORT}
        `)
})

// Initialize Socket.IO
socketService.init(server, {
    origin: process.env.CLIENT_URL || "http://localhost:3000"
});

// Initialize notification service with socket service
notificationService.init(socketService);

// Initialize cron jobs
cronJobService.init();

// Initialize event listener manager (blockchain + subgraph polling)
eventListenerManager.startAll()
    .then(() => {
        console.log('🎧 All event listening systems started successfully!');
        console.log('📊 Monitoring: Factory, Marketplace (blockchain) + NFT events (subgraph)');
    })
    .catch(error => {
        console.error('❌ Failed to start event listening systems:', error);
    });

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');

    // Stop cron jobs
    cronJobService.stopAllJobs();

    // Stop all event listening systems
    await eventListenerManager.stopAll();

    server.close(() => {
        console.log('💤 Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');

    // Stop cron jobs
    cronJobService.stopAllJobs();

    // Stop all event listening systems
    await eventListenerManager.stopAll();

    server.close(() => {
        console.log('💤 Server closed');
        process.exit(0);
    });
});
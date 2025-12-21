"use strict";

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import JWTUtils from '../utils/jwt.js';

/**
 * @class SocketService
 * @description Realtime socket service for push notifications and live updates
 */
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> Set of socketIds
    this.socketUsers = new Map(); // socketId -> userId
  }

  /**
   * @dev Initialize Socket.IO server
   * @param {http.Server} server - HTTP server instance
   * @param {Object} corsOptions - CORS configuration
   */
  init(server, corsOptions = {}) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
        ...corsOptions
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('🚀 Socket.IO server initialized');
  }

  /**
   * @dev Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = JWTUtils.extractTokenFromCookie(socket.handshake.headers.cookie);

        if (!token) {
          throw new AuthFailureError('Access token required');
        }

        const decoded = JWTUtils.verifyToken(token);

        socket.userId = decoded.id;
        socket.user = decoded;

        console.log(`🔐 User authenticated: ${socket.userId} (${socket.id})`);
        next();

      } catch (error) {
        console.error('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * @dev Setup socket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Handle notification events
      socket.on('notification:mark_read', (data) => {
        this.handleMarkNotificationRead(socket, data);
      });

      socket.on('notification:mark_all_read', () => {
        this.handleMarkAllNotificationsRead(socket);
      });
    });
  }

  /**
   * @dev Handle new connection
   * @param {Socket} socket - Socket instance
   */
  handleConnection(socket) {
    const userId = socket.userId;

    // Add to connected users map
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);
    this.socketUsers.set(socket.id, userId);

    console.log(`👋 User connected: ${userId} (${socket.id})`);
    console.log(`📊 Active connections: ${this.connectedUsers.size} users, ${this.socketUsers.size} sockets`);

    // Join user to personal room
    socket.join(`user:${userId}`);

    // Emit connection success
    socket.emit('connected', {
      message: 'Connected to realtime service',
      userId: userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * @dev Handle disconnection
   * @param {Socket} socket - Socket instance
   */
  handleDisconnection(socket) {
    const userId = this.socketUsers.get(socket.id);

    if (userId) {
      // Remove from maps
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
      this.socketUsers.delete(socket.id);

      console.log(`👋 User disconnected: ${userId} (${socket.id})`);
      console.log(`📊 Active connections: ${this.connectedUsers.size} users, ${this.socketUsers.size} sockets`);
    }
  }

  /**
   * @dev Handle mark notification as read
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Notification data
   */
  async handleMarkNotificationRead(socket, data) {
    try {
      const { notificationId } = data;

      // Import notification service dynamically to avoid circular dependency
      const { default: notificationService } = await import('./notification.service.js');

      await notificationService.markAsRead(notificationId, socket.userId);

      socket.emit('notification:read_success', {
        notificationId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      socket.emit('notification:read_error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * @dev Handle mark all notifications as read
   * @param {Socket} socket - Socket instance
   */
  async handleMarkAllNotificationsRead(socket) {
    try {
      // Import notification service dynamically to avoid circular dependency
      const { default: notificationService } = await import('./notification.service.js');

      await notificationService.markAllAsRead(socket.userId);

      socket.emit('notifications:all_read_success', {
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      socket.emit('notifications:all_read_error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * @dev Send notification to specific user
   * @param {string} userId - Target user ID
   * @param {Object} notification - Notification data
   */
  async sendNotificationToUser(userId, notification) {
    try {
      const room = `user:${userId}`;

      this.io.to(room).emit('notification:new', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`📨 Notification sent to user ${userId}:`, notification.title);

    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
    }
  }

  /**
   * @dev Send unread count update to user
   * @param {string} userId - Target user ID
   * @param {number} unreadCount - Unread notification count
   */
  async sendUnreadCountUpdate(userId, unreadCount) {
    try {
      const room = `user:${userId}`;

      this.io.to(room).emit('notification:unread_count', {
        unreadCount,
        timestamp: new Date().toISOString()
      });

      console.log(`📊 Unread count updated for user ${userId}: ${unreadCount}`);

    } catch (error) {
      console.error('❌ Error sending unread count update:', error);
    }
  }

  /**
   * @dev Check if user is online
   * @param {string} userId - User ID
   * @returns {boolean} - Whether user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * @dev Get online users count
   * @returns {number} - Number of online users
   */
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * @dev Get connected sockets count
   * @returns {number} - Number of connected sockets
   */
  getConnectedSocketsCount() {
    return this.socketUsers.size;
  }

  /**
   * @dev Get service status
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      isInitialized: !!this.io,
      onlineUsers: this.getOnlineUsersCount(),
      connectedSockets: this.getConnectedSocketsCount(),
      rooms: this.io ? Object.keys(this.io.sockets.adapter.rooms) : []
    };
  }
}

// Export singleton instance
const socketService = new SocketService();
export { SocketService };
export default socketService;
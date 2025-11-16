"use strict";

import Notification from '../models/notification.model.js';
import { SocketService } from './socket.service.js';

/**
 * @class NotificationService
 * @description Service to handle notification creation and delivery
 */
class NotificationService {
    constructor() {
        this.socketService = null;
    }

    /**
     * @dev Initialize notification service with socket instance
     * @param {SocketService} socketService - Socket service instance
     */
    init(socketService) {
        this.socketService = socketService;
        console.log('📡 NotificationService initialized with socket support');
    }

    /**
     * @dev Create and send notification to user
     * @param {Object} notificationData - Notification data
     * @param {string} notificationData.user_id - User ID
     * @param {string} notificationData.type - Notification type
     * @param {string} notificationData.title - Notification title
     * @param {string} notificationData.message - Notification message
     * @param {Object} notificationData.data - Additional data
     * @param {string} notificationData.tx_hash - Transaction hash (optional)
     * @param {boolean} sendRealtime - Whether to send realtime notification
     */
    async createAndSendNotification(notificationData, sendRealtime = true) {
        try {
            console.log('📨 Creating notification for user:', notificationData.user_id);

            // Create notification in database
            const notification = await Notification.createNotification(notificationData);

            // Send realtime notification if socket service is available
            if (sendRealtime && this.socketService) {
                await this.socketService.sendNotificationToUser(
                    notificationData.user_id,
                    notification.toJSON()
                );
            }

            // Update notification as pushed
            notification.is_pushed = true;
            await notification.save();

            console.log('✅ Notification created and sent:', notification.id);
            return notification;

        } catch (error) {
            console.error('❌ Error creating notification:', error);
            throw error;
        }
    }

    /**
     * @dev Create NFT listing notification
     * @param {Object} eventData - Event data from blockchain
     * @param {Object} nftMetadata - NFT metadata
     */
    async createNFTListingNotification(eventData, nftMetadata) {
        try {
            const nftTitle = nftMetadata?.metadata?.title || 'Unknown';
            const message = `Your NFT ${nftTitle} has been successfully listed for ${eventData.price} ETH`;
            const notificationData = {
                user_id: nftMetadata?.metadata?.user_id,
                type: 'nft_listed',
                title: `NFT Listed for Sale`,
                message,
                data: {
                    price: eventData.price,
                    image: nftMetadata?.metadata?.image
                },
                tx_hash: eventData.transactionHash
            };

            return await this.createAndSendNotification(notificationData);

        } catch (error) {
            console.error('❌ Error creating NFT listing notification:', error);
            throw error;
        }
    }

    /**
     * @dev Create NFT sale notification
     * @param {Object} eventData - Sale event data
     */
    async createNFTSaleNotification(eventData) {
        try {
            // Notification for seller
            const sellerNotification = {
                user_id: eventData.seller,
                type: 'nft_sold',
                title: `NFT Sold!`,
                message: `Your NFT has been sold for ${eventData.price} ETH to ${eventData.buyer}`,
                data: {
                    nft_contract: eventData.nftContract,
                    token_id: eventData.tokenId,
                    price: eventData.price,
                    buyer: eventData.buyer,
                    sale_id: eventData.saleId
                },
                tx_hash: eventData.transactionHash
            };

            // Notification for buyer
            const buyerNotification = {
                user_id: eventData.buyer,
                type: 'nft_bought',
                title: `NFT Purchase Successful!`,
                message: `You have successfully purchased an NFT for ${eventData.price} ETH`,
                data: {
                    nft_contract: eventData.nftContract,
                    token_id: eventData.tokenId,
                    price: eventData.price,
                    seller: eventData.seller,
                    sale_id: eventData.saleId
                },
                tx_hash: eventData.transactionHash
            };

            // Send both notifications
            const notifications = await Promise.all([
                this.createAndSendNotification(sellerNotification),
                this.createAndSendNotification(buyerNotification)
            ]);

            return notifications;

        } catch (error) {
            console.error('❌ Error creating NFT sale notifications:', error);
            throw error;
        }
    }

    /**
     * @dev Create bid notification
     * @param {Object} bidData - Bid event data
     */
    async createBidNotification(bidData) {
        try {
            const notificationData = {
                user_id: bidData.nft_owner,
                type: 'bid_received',
                title: `New Bid Received`,
                message: `You received a bid of ${bidData.bid_amount} ETH for your NFT`,
                data: {
                    nft_contract: bidData.nftContract,
                    token_id: bidData.tokenId,
                    bid_amount: bidData.bid_amount,
                    bidder: bidData.bidder,
                    bid_id: bidData.bidId
                },
                tx_hash: bidData.transactionHash
            };

            return await this.createAndSendNotification(notificationData);

        } catch (error) {
            console.error('❌ Error creating bid notification:', error);
            throw error;
        }
    }

    /**
     * @dev Get user notifications with pagination
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     */
    async getUserNotifications(userId, options = {}) {
        try {
            return await Notification.getUserNotifications(userId, options);
        } catch (error) {
            console.error('❌ Error getting user notifications:', error);
            throw error;
        }
    }

    /**
     * @dev Get unread notification count
     * @param {string} userId - User ID
     */
    async getUnreadCount(userId) {
        try {
            return await Notification.getUnreadCount(userId);
        } catch (error) {
            console.error('❌ Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * @dev Mark notification as read
     * @param {string} notificationId - Notification ID
     * @param {string} userId - User ID (for security)
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOne({
                where: {
                    id: notificationId,
                    user_id: userId
                }
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.markAsRead();

            // Send realtime update for unread count
            if (this.socketService) {
                const unreadCount = await this.getUnreadCount(userId);
                await this.socketService.sendUnreadCountUpdate(userId, unreadCount);
            }

            return notification;

        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * @dev Mark all notifications as read for user
     * @param {string} userId - User ID
     */
    async markAllAsRead(userId) {
        try {
            await Notification.markAllAsRead(userId);

            // Send realtime update for unread count
            if (this.socketService) {
                await this.socketService.sendUnreadCountUpdate(userId, 0);
            }

            console.log(`✅ Marked all notifications as read for user: ${userId}`);

        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * @dev Send welcome notification to new user
     * @param {string} userId - User ID
     * @param {string} username - Username
     */
    async sendWelcomeNotification(userId, username) {
        try {
            const notificationData = {
                user_id: userId,
                type: 'welcome',
                title: `Welcome to NexArt!`,
                message: `Hello ${username}! Welcome to the NFT marketplace. Start exploring amazing digital art collections.`,
                data: {
                    username,
                    welcome_date: new Date().toISOString()
                }
            };

            return await this.createAndSendNotification(notificationData);

        } catch (error) {
            console.error('❌ Error sending welcome notification:', error);
            throw error;
        }
    }

    /**
     * @dev Cleanup expired notifications (can be called by cron job)
     */
    async cleanupExpiredNotifications() {
        try {
            const result = await Notification.cleanupExpired();
            console.log(`🧹 Cleaned up ${result} expired notifications`);
            return result;
        } catch (error) {
            console.error('❌ Error cleaning up notifications:', error);
            throw error;
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
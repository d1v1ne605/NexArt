"use strict";

import notificationService from '../service/notification.service.js';
import { SuccessResponse } from '../core/success.response.js';
import { ErrorResponse } from '../core/error.response.js';

/**
 * @class NotificationController
 * @description Handle notification-related HTTP requests
 */
class NotificationController {

    /**
     * @dev Get user notifications with pagination
     */
    async getUserNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                page = 1,
                limit = 20,
                unreadOnly = false,
                type = null
            } = req.query;

            const offset = (page - 1) * limit;

            const result = await notificationService.getUserNotifications(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadOnly: unreadOnly === 'true',
                type,
            });

            new SuccessResponse({
                message: 'Notifications retrieved successfully',
                metadata: {
                    notifications: result.rows,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(result.count / limit),
                        total_count: result.count,
                        per_page: parseInt(limit),
                        has_next: (page * limit) < result.count,
                        has_prev: page > 1
                    }
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @dev Get unread notifications count
     */
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const unreadCount = await notificationService.getUnreadCount(userId);

            new SuccessResponse({
                message: 'Unread count retrieved successfully',
                metadata: {
                    unread_count: unreadCount
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @dev Mark notification as read
     */
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const notificationId = req.params.id;

            const notification = await notificationService.markAsRead(notificationId, userId);

            new SuccessResponse({
                message: 'Notification marked as read',
                metadata: {
                    notification: notification.toJSON()
                }
            }).send(res);

        } catch (error) {
            if (error.message === 'Notification not found') {
                return new ErrorResponse('Notification not found', 404).send(res);
            }
            next(error);
        }
    }

    /**
     * @dev Mark all notifications as read
     */
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;

            await notificationService.markAllAsRead(userId);

            new SuccessResponse({
                message: 'All notifications marked as read'
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @dev Delete notification
     */
    async deleteNotification(req, res, next) {
        try {
            const userId = req.user.id;
            const notificationId = req.params.id;

            // Import Notification model
            const { default: Notification } = await import('../models/notification.model.js');

            const notification = await Notification.findOne({
                where: {
                    id: notificationId,
                    user_id: userId
                }
            });

            if (!notification) {
                return new ErrorResponse('Notification not found', 404).send(res);
            }

            await notification.destroy();

            new SuccessResponse({
                message: 'Notification deleted successfully'
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @dev Get available notification types
     */
    async getNotificationTypes(req, res, next) {
        try {
            const types = [
                { value: 'nft_sold', label: 'NFT Sold' },
                { value: 'nft_bought', label: 'NFT Purchased' },
                { value: 'nft_listed', label: 'NFT Listed' },
                { value: 'nft_unlisted', label: 'NFT Unlisted' },
                { value: 'bid_received', label: 'Bid Received' },
                { value: 'bid_accepted', label: 'Bid Accepted' },
                { value: 'bid_rejected', label: 'Bid Rejected' },
                { value: 'price_drop', label: 'Price Drop' },
                { value: 'auction_started', label: 'Auction Started' },
                { value: 'auction_ending', label: 'Auction Ending' },
                { value: 'follow_activity', label: 'Follow Activity' },
                { value: 'welcome', label: 'Welcome' },
                { value: 'achievement', label: 'Achievement' }
            ];

            new SuccessResponse({
                message: 'Notification types retrieved successfully',
                metadata: {
                    types
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }
}

export default new NotificationController();
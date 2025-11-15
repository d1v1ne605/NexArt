"use strict";

import express from 'express';
import notificationService from '../../service/notification.service.js';
import { SuccessResponse } from '../../core/success.response.js';
import { ErrorResponse } from '../../core/error.response.js';

const router = express.Router();

/**
 * @route GET /notifications
 * @desc Get user notifications with pagination
 * @access Private
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
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
});

/**
 * @route GET /notifications/unread-count
 * @desc Get unread notifications count
 * @access Private
 */
router.get('/unread-count', async (req, res, next) => {
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
});

/**
 * @route PUT /notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', async (req, res, next) => {
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
});

/**
 * @route PUT /notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    await notificationService.markAllAsRead(userId);

    new SuccessResponse({
      message: 'All notifications marked as read'
    }).send(res);

  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /notifications/test
 * @desc Send test notification (development only)
 * @access Private
 */
router.post('/test', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return new ErrorResponse('Test endpoint not available in production', 403).send(res);
    }

    const userId = req.user.id;
    const { type = 'welcome', title, message } = req.body;

    const notificationData = {
      user_id: userId,
      type,
      title: title || 'Test Notification',
      message: message || 'This is a test notification from NexArt API',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const notification = await notificationService.createAndSendNotification(notificationData);

    new SuccessResponse({
      message: 'Test notification sent successfully',
      metadata: {
        notification: notification.toJSON()
      }
    }).send(res);

  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Import Notification model
    const { default: Notification } = await import('../../models/notification.model.js');

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
});

/**
 * @route GET /notifications/types
 * @desc Get available notification types
 * @access Private
 */
router.get('/types', async (req, res, next) => {
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
});

export default router;
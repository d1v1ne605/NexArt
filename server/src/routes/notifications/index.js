"use strict";

import express from 'express';
import notificationController from '../../controller/notification.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route GET /notifications
 * @desc Get user notifications with pagination
 * @access Private
 */
router.get('/', authenticateToken, notificationController.getUserNotifications);

/**
 * @route GET /notifications/unread-count
 * @desc Get unread notifications count
 * @access Private
 */
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

/**
 * @route GET /notifications/types
 * @desc Get available notification types
 * @access Private
 */
router.get('/types', authenticateToken, notificationController.getNotificationTypes);

/**
 * @route PUT /notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

/**
 * @route PUT /notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

/**
 * @route DELETE /notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

export default router;
import express from 'express';
const router = express.Router();
import authController from '../../controller/auth.controller.js';
import { authenticateToken, optionalAuth } from '../../middleware/auth.middleware.js';

// @route   GET /auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', authController.googleAuth);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', authController.googleCallback);

// @route   POST /auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, authController.logout);

// @route   GET /auth/check
// @desc    Check authentication status
// @access  Public (with optional auth)
router.get('/check', optionalAuth, authController.checkAuth);

export default router;
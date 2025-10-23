import express from 'express';
const router = express.Router();
import UserController from '../../controller/user.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

// @route   GET /user/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, UserController.getCurrentUser);

// @route  POST /user/profile
// @desc   Update user profile
// @access Private
router.post('/profile', authenticateToken, UserController.updateProfile);

export default router;
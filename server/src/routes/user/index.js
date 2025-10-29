import express from "express";
const router = express.Router();
<<<<<<< HEAD
import authController from "../../controller/auth.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
=======
import UserController from '../../controller/user.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
>>>>>>> 67c5dfdee6757f6166fdf25e86d1eeb2e30eb8ff

// @route   GET /user/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticateToken, authController.getCurrentUser);
=======
router.get('/me', authenticateToken, UserController.getCurrentUser);

// @route  POST /user/profile
// @desc   Update user profile
// @access Private
router.post('/profile', authenticateToken, UserController.updateProfile);
>>>>>>> 67c5dfdee6757f6166fdf25e86d1eeb2e30eb8ff

export default router;

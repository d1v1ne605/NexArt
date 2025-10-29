import express from "express";
const router = express.Router();
import authController from "../../controller/auth.controller.js";
import { authenticateToken } from "../../middleware/auth.js";

// @route   GET /auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticateToken, authController.getCurrentUser);

export default router;

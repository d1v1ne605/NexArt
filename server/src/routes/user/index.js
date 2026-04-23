import express from "express";
const router = express.Router();
import UserController from "../../controller/user.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

/**
 * @route GET /auth/user
 * @desc Get public user info by ID
 * @response { user: object }
 */
router.get("/info/:id", UserController.getPublicUserInfoById);

/**
 * @route GET /auth/me
 * @desc Get current authenticated user
 * @cookie auth_token (or Authorization header)
 * @response { user: object }
 */
router.get("/me", authenticateToken, UserController.getCurrentUser);

// @route  POST /user/profile
// @desc   Update user profile
// @access Private
router.post("/profile", authenticateToken, UserController.updateProfile);

export default router;

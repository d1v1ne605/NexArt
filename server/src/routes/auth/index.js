"use strict";

import express from 'express';
import WalletAuthController from '../../controller/walletAuth.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /auth/nonce
 * @desc Generate nonce for wallet authentication
 * @body { address: string }
 * @response { nonce: string, message: string, expiresAt: Date }
 */
router.post('/nonce', WalletAuthController.generateNonce);

/**
 * @route POST /auth/verify
 * @desc Verify wallet signature and authenticate user
 * @body { address: string, message: string, signature: string }
 * @response { user: object, token: string, expiresIn: string }
 */
router.post('/verify', WalletAuthController.verifySignature);

/**
 * @route POST /auth/logout
 * @desc Logout user (clear session)
 * @response { message: string }
 */
router.post('/logout', authenticateToken, WalletAuthController.logout);

/**
 * @route GET /auth/validate-message
 * @desc Validate message format (utility endpoint)
 * @query { message: string }
 * @response { isValid: boolean, nonce: string, formatErrors: array }
 */
router.get('/validate-message', WalletAuthController.validateMessage);

/**
 * @route POST /auth/cleanup-nonces
 * @desc Cleanup expired nonces (admin endpoint)
 * @response { deletedCount: number }
 */
router.post('/cleanup-nonces', WalletAuthController.cleanupNonces);

export default router;
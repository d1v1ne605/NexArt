"use strict";

import WalletAuthService from "../service/walletAuth.service.js";
import { SuccessResponse } from "../core/success.response.js";
import { BadRequestError } from "../core/error.response.js";

class WalletAuthController {
  /**
   * POST /auth/nonce
   * Generate nonce for wallet authentication
   */
  static async generateNonce(req, res, next) {
    try {
      console.log("Generating nonce for address:", req.body);
      const { address } = req.body;

      // Validate input
      if (!address) {
        throw new BadRequestError("Wallet address is required");
      }

      // Generate nonce
      const result = await WalletAuthService.generateNonce(address);

      new SuccessResponse({
        message: "Nonce generated successfully",
        metadata: {
          nonce: result.nonce,
          message: result.message,
          expiresAt: result.expiresAt,
        },
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/verify
   * Verify wallet signature and authenticate user
   */
  static async verifySignature(req, res, next) {
    try {
      const { address, message, signature } = req.body;

      // Validate input
      if (!address || !message || !signature) {
        throw new BadRequestError(
          "Missing required fields: address, message, signature"
        );
      }

      // Verify signature and authenticate
      const result = await WalletAuthService.verifySignatureAndAuth(
        address,
        message,
        signature
      );

      // Set HTTP-only cookie with JWT token
      const cookieOptions = WalletAuthService.getSessionCookieOptions();
      res.cookie("accessToken", "Bearer " + result.token, cookieOptions);

      new SuccessResponse({
        message: "Authentication successful",
        metadata: {
          user: result.user,
          token: result.token, // Also send in response for client-side storage if needed
          expiresIn: result.expiresIn,
        },
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * Logout user (clear session)
   */
  static async logout(req, res, next) {
    try {
      const cookieOptions = WalletAuthService.getSessionCookieOptions();
      // Clear the authentication cookie
      res.clearCookie("accessToken", cookieOptions);

      new SuccessResponse({
        message: "Logged out successfully",
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/validate-message
   * Validate message format (utility endpoint)
   */
  static async validateMessage(req, res, next) {
    try {
      const { message } = req.query;

      if (!message) {
        throw new BadRequestError("Message is required");
      }

      const isValid = WalletAuthService.validateMessageFormat(message);
      const nonce = WalletAuthService.extractNonceFromMessage(message);

      new SuccessResponse({
        message: "Message validation completed",
        metadata: {
          isValid,
          nonce,
          formatErrors: isValid
            ? null
            : [
              'Message should contain "Welcome to NexArt"',
              'Message should contain "Nonce: [nonce_value]"',
              "Message should contain authentication text",
            ],
        },
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/cleanup-nonces
   * Cleanup expired nonces (admin endpoint)
   */
  static async cleanupNonces(req, res, next) {
    try {
      // This should be protected by admin middleware in production
      const deletedCount = await WalletAuthService.cleanupExpiredNonces();

      new SuccessResponse({
        message: "Nonces cleanup completed",
        metadata: {
          deletedCount,
        },
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

export default WalletAuthController;

"use strict";

import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import WalletNonce from "../models/walletNonce.model.js";
import User from "../models/user.model.js";
import JWTUtils from "../utils/jwt.js";

/**
 * Wallet Authentication Service
 */
class WalletAuthService {

    /**
     * Generate nonce for wallet authentication
     * @param {string} walletAddress - The wallet address
     * @param {number} ttlMinutes - Time to live in minutes (default: 10)
     * @returns {object} { nonce, expiresAt }
     */
    static async generateNonce(walletAddress, ttlMinutes = 10) {
        try {
            // Validate wallet address
            if (!ethers.isAddress(walletAddress)) {
                throw new Error('Invalid wallet address');
            }

            const isExistingUser = await User.findByWalletAddress(walletAddress);
            if (!isExistingUser) {
                await User.createOrUpdateUser(walletAddress);
            }

            // Check if there are too many active nonces for this wallet
            const activeNoncesCount = await WalletNonce.getActiveNoncesCount(walletAddress);
            if (activeNoncesCount >= 5) {
                throw new Error('Too many active nonces. Please wait for previous nonces to expire.');
            }

            // Create new nonce
            const walletNonce = await WalletNonce.createNonce(walletAddress, ttlMinutes);

            return {
                nonce: walletNonce.nonce,
                expiresAt: walletNonce.expires_at,
                message: this.createSignMessage(walletNonce.nonce)
            };
        } catch (error) {
            throw new Error(`Failed to generate nonce: ${error.message}`);
        }
    }

    /**
     * Create sign message for wallet signing
     * @param {string} nonce - The nonce string
     * @returns {string} - Message to be signed
     */
    static createSignMessage(nonce) {
        return `Welcome to NexArt! Sign this message to authenticate your wallet. Nonce: ${nonce}. This request will not trigger a blockchain transaction or cost any gas fees.`;
    }

    /**
     * Extract nonce from signed message
     * @param {string} message - The signed message
     * @returns {string|null} - Extracted nonce or null if not found
     */
    static extractNonceFromMessage(message) {
        try {
            const nonceMatch = message.match(/Nonce:\s*([^\s\n.!?,]+)/);
            return nonceMatch ? nonceMatch[1] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Verify wallet signature and authenticate user
     * @param {string} walletAddress - The wallet address
     * @param {string} message - The signed message
     * @param {string} signature - The signature
     * @returns {object} { user, token }
     */
    static async verifySignatureAndAuth(walletAddress, message, signature) {
        try {
            // Validate input parameters
            if (!walletAddress || !message || !signature) {
                throw new Error('Missing required parameters: walletAddress, message, or signature');
            }

            if (!ethers.isAddress(walletAddress)) {
                throw new Error('Invalid wallet address');
            }

            // Step 1: Recover address from signature
            const recoveredAddress = await this.recoverAddressFromSignature(message, signature);
            console.log(`Recovered Address: ${recoveredAddress}`);

            // Step 2: Compare addresses (case-insensitive)
            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error('Signature verification failed: address mismatch');
            }

            // Step 3: Extract and verify nonce
            const nonce = this.extractNonceFromMessage(message);
            console.log(`Extracted nonce: "${nonce}"`); // Debug log
            if (!nonce) {
                throw new Error('Invalid message format: nonce not found');
            }

            // Step 4: Verify nonce exists and is valid
            const walletNonce = await WalletNonce.findValidNonce(nonce, walletAddress);
            console.log(`Found wallet nonce:`, walletNonce ? `${walletNonce.nonce}` : 'null'); // Debug log

            if (!walletNonce) {
                throw new Error('Invalid or expired nonce');
            }

            // Step 5: Mark nonce as used
            await walletNonce.markAsUsed();

            // Step 6: Get existing user (should exist from nonce generation)
            const user = await User.findByWalletAddress(walletAddress);
            if (!user) {
                throw new Error('User not found');
            }

            // Update last login
            await user.updateLastLogin();

            // Step 7: Generate JWT token
            const token = JWTUtils.generateAccessToken(user);

            return {
                success: true,
                user: user.toJSON(),
                token,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            };

        } catch (error) {
            console.error('Auth verification error:', error.message); // Debug log
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Recover address from signature
     * @param {string} message - The original message
     * @param {string} signature - The signature
     * @returns {string} - Recovered address
     */
    static async recoverAddressFromSignature(message, signature) {
        try {
            // Use ethers.js to recover the address
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress;
        } catch (error) {
            throw new Error(`Failed to recover address: ${error.message}`);
        }
    }

    /**
     * Cleanup expired nonces (can be called by cron job)
     * @returns {number} - Number of expired nonces deleted
     */
    static async cleanupExpiredNonces() {
        try {
            const deletedCount = await WalletNonce.cleanupExpiredNonces();
            console.log(`Cleaned up ${deletedCount} expired nonces`);
            return deletedCount;
        } catch (error) {
            console.error('Failed to cleanup expired nonces:', error);
            throw error;
        }
    }

    /**
     * Validate message format
     * @param {string} message - The message to validate
     * @returns {boolean} - Whether message is valid
     */
    static validateMessageFormat(message) {
        try {
            const hasWelcome = message.includes('Welcome to NexArt');
            const hasNonce = /Nonce:\s*([^\s\n]+)/.test(message);
            const hasAuthText = message.includes('Sign this message to authenticate');

            return hasWelcome && hasNonce && hasAuthText;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate session cookie options
     * @returns {object} - Cookie options
     */
    static getSessionCookieOptions() {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
        };
    }
}

export default WalletAuthService;
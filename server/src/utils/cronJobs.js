"use strict";

import cron from 'node-cron';
import WalletAuthService from '../service/walletAuth.service.js';

/**
 * Cleanup expired nonces every hour
 * Runs at minute 0 of every hour
 */
const scheduleNonceCleanup = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('🧹 Starting nonce cleanup job...');
            const deletedCount = await WalletAuthService.cleanupExpiredNonces();
            console.log(`✅ Nonce cleanup completed. Deleted ${deletedCount} expired nonces.`);
        } catch (error) {
            console.error('❌ Nonce cleanup failed:', error);
        }
    });

    console.log('⏰ Nonce cleanup cron job scheduled (every hour at minute 0)');
};

/**
 * Manual cleanup function (can be called on server start)
 */
const cleanupNoncesNow = async () => {
    try {
        console.log('🧹 Starting immediate nonce cleanup...');
        const deletedCount = await WalletAuthService.cleanupExpiredNonces();
        console.log(`✅ Immediate nonce cleanup completed. Deleted ${deletedCount} expired nonces.`);
        return deletedCount;
    } catch (error) {
        console.error('❌ Immediate nonce cleanup failed:', error);
        throw error;
    }
};

export {
    scheduleNonceCleanup,
    cleanupNoncesNow
};
"use strict";

import { DataTypes, Op } from "sequelize";
import instanceMySQL from "../dbs/init.mysql.js";
import { isAddress } from "ethers";

const sequelize = instanceMySQL.getSequelize();

const WalletNonce = sequelize.define("WalletNonce", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: "Unique identifier for wallet nonce record"
    },
    wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        validate: {
            isEthereumAddress(value) {
                if (!isAddress(value)) {
                    throw new Error('Invalid Ethereum wallet address');
                }
            },
            notEmpty: true
        },
        comment: "Ethereum wallet address"
    },
    nonce: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: "Random nonce string for signature verification"
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "When this nonce expires"
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether this nonce has been used for authentication"
    }
}, {
    tableName: "wallet_nonces",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['wallet_address']
        },
        {
            unique: true,
            fields: ['nonce']
        },
    ],
    hooks: {
        beforeCreate: async (walletNonce) => {
            // Convert wallet address to lowercase for consistency
            if (walletNonce.wallet_address) {
                walletNonce.wallet_address = walletNonce.wallet_address.toLowerCase();
            }
        },
        beforeUpdate: async (walletNonce) => {
            if (walletNonce.changed('wallet_address') && walletNonce.wallet_address) {
                walletNonce.wallet_address = walletNonce.wallet_address.toLowerCase();
            }
        }
    }
});

// Instance methods
WalletNonce.prototype.isExpired = function () {
    return new Date() > this.expires_at;
};

WalletNonce.prototype.markAsUsed = async function () {
    this.is_used = true;
    await this.save();
    return this;
};

// Class methods
/**
 * Generate a random nonce string
 */
WalletNonce.generateNonce = function() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`;
};

/**
 * Create a new nonce for wallet address
 */
WalletNonce.createNonce = async function(walletAddress, ttlMinutes = 10) {
    const nonce = this.generateNonce();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    // Clean up old nonces for this wallet
    await this.cleanupOldNonces(walletAddress);

    const walletNonce = await this.create({
        wallet_address: walletAddress.toLowerCase(),
        nonce,
        expires_at: expiresAt
    });

    return walletNonce;
};

/**
 * Find a valid nonce by nonce string
 */
WalletNonce.findValidNonce = async function(nonceString, walletAddress) {
    return await this.findOne({
        where: {
            nonce: nonceString,
            wallet_address: walletAddress.toLowerCase(),
            is_used: false,
            expires_at: {
                [Op.gt]: new Date()
            }
        }
    });
};

/**
 * Clean up old/expired nonces for a wallet
 */
WalletNonce.cleanupOldNonces = async function(walletAddress) {
    await this.destroy({
        where: {
            wallet_address: walletAddress.toLowerCase(),
            [Op.or]: [
                { is_used: true },
                { expires_at: { [Op.lt]: new Date() } }
            ]
        }
    });
};

/**
 * Clean up all expired nonces (can be called by cron job)
 */
WalletNonce.cleanupExpiredNonces = async function() {
    const result = await this.destroy({
        where: {
            [Op.or]: [
                { is_used: true },
                { expires_at: { [Op.lt]: new Date() } }
            ]
        }
    });
    return result;
};

/**
 * Get active nonces count for a wallet
 */
WalletNonce.getActiveNoncesCount = async function(walletAddress) {
    return await this.count({
        where: {
            wallet_address: walletAddress.toLowerCase(),
            is_used: false,
            expires_at: {
                [Op.gt]: new Date()
            }
        }
    });
};

export default WalletNonce;
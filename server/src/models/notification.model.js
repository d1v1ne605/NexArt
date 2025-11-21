"use strict";

import { DataTypes } from "sequelize";
import instanceMySQL from "../dbs/init.mysql.js";
import { isHexString } from "ethers"

const sequelize = instanceMySQL.getSequelize();

const Notification = sequelize.define("Notification", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: "Unique identifier for notification"
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: "Foreign key referencing users table (for wallet-based users)"
    },
    type: {
        type: DataTypes.ENUM(
            'nft_sold',           // NFT was sold
            'nft_bought',         // NFT was purchased
            'nft_listed',         // NFT was listed for sale
            'nft_unlisted',       // NFT was removed from sale
            'bid_received',       // Received a bid on NFT
            'bid_accepted',       // Your bid was accepted
            'bid_rejected',       // Your bid was rejected
            'price_drop',         // NFT you're watching dropped in price
            'auction_started',    // Auction started for favorited NFT
            'auction_ending',     // Auction ending soon
            'follow_activity',    // Someone you follow did something
            'welcome',            // Welcome message
            'achievement'         // Achievement unlocked
        ),
        allowNull: false,
        comment: "Type of notification"
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [1, 255],
            notEmpty: true
        },
        comment: "Notification title/headline"
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 1000] // Max 1000 characters for message
        },
        comment: "Detailed notification message"
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional data related to the notification (NFT details, transaction hash, etc.)"
    },
    tx_hash: {
        type: DataTypes.STRING(66),
        allowNull: true,
        validate: {
            isTransactionHash(value) {
                if (value && !isHexString(value, 32)) {
                    throw new Error('Invalid transaction hash format');
                }
            }
        },
        comment: "Related blockchain transaction hash"
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the notification has been read"
    },
    is_pushed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether push notification was sent"
    },
}, {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['tx_hash']
        },
        {
            fields: ['type']
        },
        {
            fields: ['is_read']
        },
        {
            fields: ['created_at']
        }
    ],
    scopes: {
        unread: {
            where: {
                is_read: false
            }
        },
    }
});

// Instance methods
Notification.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
};

Notification.prototype.markAsRead = async function () {
    this.is_read = true;
    await this.save();
    return this;
};

// Class methods
Notification.getUserNotifications = async function (userId, options = {}) {
    const {
        limit = 20,
        offset = 0,
        unreadOnly = false,
        type = null,
    } = options;

    const whereClause = {};

    if (userId) {
        whereClause.user_id = userId;
    }

    if (unreadOnly) {
        whereClause.is_read = false;
    }

    if (type) {
        whereClause.type = type;
    }

    const includeModel =
    {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'display_name', 'avatar_url']
    };

    return await this.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        include: [includeModel]
    });
};

Notification.getUnreadCount = async function (userId) {
    const whereClause = {
        is_read: false,
    };

    if (userId) {
        whereClause.user_id = userId;
    }

    return await this.count({
        where: whereClause
    });
};

Notification.markAllAsRead = async function (userId) {
    const whereClause = {
        is_read: false
    };

    if (userId) {
        whereClause.user_id = userId;
    }

    return await this.update(
        { is_read: true },
        {
            where: whereClause
        }
    );
};

Notification.createNotification = async function (notificationData) {
    // Validate required fields
    const { type, title, message } = notificationData;
    const hasUser = notificationData.user_id !== undefined && notificationData.user_id !== null;

    if (!hasUser || !type || !title || !message) {
        throw new Error('Missing required notification fields');
    }

    return await this.create(notificationData);
};

Notification.bulkCreateNotifications = async function (notifications) {
    return await this.bulkCreate(notifications, {
        validate: true,
        ignoreDuplicates: true
    });
};

/**
 * @dev Auto-cleanup old notifications (30+ days)
 * @notice This function removes notifications older than 30 days
 * @returns {Promise<number>} Number of deleted notifications
 */
Notification.cleanupExpired = async function () {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return await this.destroy({
        where: {
            created_at: {
                [sequelize.Sequelize.Op.lt]: thirtyDaysAgo
            }
        }
    });
};

export default Notification;
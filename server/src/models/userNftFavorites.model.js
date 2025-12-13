"use strict";

import { DataTypes } from "sequelize";
import instanceMySQL from "../dbs/init.mysql.js";
import { isAddress } from "ethers"

const sequelize = instanceMySQL.getSequelize();

const UserNFTFavorites = sequelize.define("UserNFTFavorites", {
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
    token_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "NFT token ID from the contract"
    },
    contract_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        validate: {
            isEthereumAddress(value) {
                if (!isAddress(value)) {
                    throw new Error('Invalid Ethereum contract address format');
                }
            }
        },
        comment: "Smart contract address of the NFT"
    },
    token_uri: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "URI pointing to NFT metadata"
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Whether the favorite is active (not removed)"
    }
}, {
    tableName: "user_nft_favorites",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['contract_address']
        },
        {
            fields: ['token_id']
        },
        {
            unique: true,
            fields: ['user_id', 'contract_address', 'token_id'],
            where: {
                user_id: {
                    [sequelize.Sequelize.Op.ne]: null
                }
            },
            name: 'unique_user_favorite'
        },
    ],
    hooks: {
        beforeCreate: async (favorite) => {
            // Convert contract address to lowercase for consistency
            if (favorite.contract_address) {
                favorite.contract_address = favorite.contract_address.toLowerCase();
            }
        },
        beforeUpdate: async (favorite) => {
            if (favorite.changed('contract_address') && favorite.contract_address) {
                favorite.contract_address = favorite.contract_address.toLowerCase();
            }
        }
    }
});

// Instance methods
UserNFTFavorites.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
};

// Class methods
UserNFTFavorites.findByUserAndNFT = async function (userId, contractAddress, tokenId, isActive = true) {
    const whereClause = {
        contract_address: contractAddress.toLowerCase(),
        token_id: tokenId,
        is_active: isActive
    };

    if (userId) {
        whereClause.user_id = userId;
    }

    return await this.findOne({
        where: whereClause
    });
};

UserNFTFavorites.getUserFavorites = async function (userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const whereClause = {
        is_active: true
    };

    if (userId) {
        whereClause.user_id = userId;
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

UserNFTFavorites.addFavorite = async function (userId, contractAddress, tokenId, tokenUri) {
    const favoriteData = {
        contract_address: contractAddress.toLowerCase(),
        token_id: tokenId,
        token_uri: tokenUri,
        is_active: true
    };

    if (userId) {
        favoriteData.user_id = userId;
    }

    // Check if favorite already exists
    const existing = await this.findByUserAndNFT(userId, contractAddress, tokenId, false);
    if (existing) {
        if (!existing.is_active) {
            // Reactivate if it was deactivated
            existing.is_active = true;
            await existing.save();
            return existing;
        }
        return existing;
    }

    return await this.create(favoriteData);
};

UserNFTFavorites.removeFavorite = async function (userId, contractAddress, tokenId) {
    const favorite = await this.findByUserAndNFT(userId, contractAddress, tokenId);
    if (favorite) {
        favorite.is_active = false;
        await favorite.save();
        return favorite;
    }
    return null;
};

UserNFTFavorites.getPopularNFTs = async function (options = {}) {
    const { limit = 10, timeframe = '7d' } = options;

    let createdAtFilter = {};
    if (timeframe === '24h') {
        createdAtFilter = {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        };
    } else if (timeframe === '7d') {
        createdAtFilter = {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        };
    }

    return await this.findAll({
        attributes: [
            'contract_address',
            'token_id',
            'metadata',
            [sequelize.fn('COUNT', sequelize.col('id')), 'favorite_count']
        ],
        where: {
            is_active: true,
            created_at: createdAtFilter
        },
        group: ['contract_address', 'token_id'],
        order: [[sequelize.literal('favorite_count'), 'DESC']],
        limit
    });
};

export default UserNFTFavorites;
"use strict";

import { DataTypes } from "sequelize";
import instanceMySQL from "../dbs/init.mysql.js";
import { isAddress } from "ethers"

const sequelize = instanceMySQL.getSequelize();

const UserNFTFavorites = sequelize.define("UserNFTFavorites", {
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: "Foreign key referencing users table"
    },
    token_id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
        comment: "NFT token ID from the contract"
    },
    contract_address: {
        type: DataTypes.STRING(42),
        primaryKey: true,
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
UserNFTFavorites.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
};

// Class methods
UserNFTFavorites.findByUserAndNFT = async function(userId, contractAddress, tokenId) {
    return await this.findOne({
        where: {
            user_id: userId,
            contract_address: contractAddress.toLowerCase(),
            token_id: tokenId,
            is_active: true
        }
    });
};

UserNFTFavorites.getUserFavorites = async function(userId, options = {}) {
    const { limit = 20, offset = 0, network = null } = options;
    
    const whereClause = {
        user_id: userId,
        is_active: true
    };
    
    if (network) {
        whereClause.network = network;
    }
    
    return await this.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['created_at', 'DESC']],
        include: [{
            model: sequelize.models.User,
            as: 'user',
            attributes: ['id', 'username', 'avatar_url']
        }]
    });
};

UserNFTFavorites.getPopularNFTs = async function(options = {}) {
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
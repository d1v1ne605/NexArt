"use strict";
// import User from './user.model.js';
import User from './user.model.js';
import WalletNonce from './walletNonce.model.js';
import UserNFTFavorites from './userNftFavorites.model.js';
import Notification from './notification.model.js';

// User - UserNFTFavorites relationship (1:many) for new wallet-based users
User.hasMany(UserNFTFavorites, {
    foreignKey: 'user_id',
    as: 'favorites',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

UserNFTFavorites.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// User - Notification relationship (1:many) for new wallet-based users
User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'notifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Notification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// User - WalletNonce relationship (1:many) for wallet authentication
User.hasMany(WalletNonce, {
    foreignKey: 'wallet_address',
    sourceKey: 'wallet_address',
    as: 'nonces',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

WalletNonce.belongsTo(User, {
    foreignKey: 'wallet_address',
    targetKey: 'wallet_address',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// Export all models
const models = {
    // User,
    User,
    WalletNonce,
    UserNFTFavorites,
    Notification
};

// Function to sync all models with database
const syncDatabase = async (options = {}) => {
    try {
        const { force = false, alter = false } = options;

        console.log('Starting database synchronization...');

        // Sync all models in the correct order (User first, then related models)
        // await User.sync({ force, alter });
        await User.sync({ force, alter });
        await WalletNonce.sync({ force, alter });

        await UserNFTFavorites.sync({ force, alter });

        await Notification.sync({ force, alter });

        console.log('✓ All models synchronized successfully');

        return true;
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        throw error;
    }
};

// Function to create initial data/seeds
const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');

        // Check if any users exist
        const userCount = await User.count();

        if (userCount === 0) {
            console.log('No users found, creating sample data...');

            // Create sample wallet-based users
            const sampleUsers = await User.bulkCreate([
                {
                    wallet_address: '0x742F35Cc6cF0532da5FaCff64Fb7e1c4c61CA79e',
                    display_name: 'Crypto Artist',
                    bio: 'Creating digital art on the blockchain',
                    is_verified: false
                },
                {
                    wallet_address: '0x8ba1f109551bD432803012645Hac136c744bdC06',
                    display_name: 'NFT Collector Pro',
                    bio: 'Collecting rare and valuable NFTs',
                    is_verified: false
                }
            ], {
                validate: true,
                ignoreDuplicates: true
            });

            console.log(`✓ Created ${sampleUsers.length} sample wallet-based users`);

            // Create sample notifications for the first user
            if (sampleUsers.length > 0) {
                await Notification.bulkCreate([
                    {
                        user_id: sampleUsers[0].id,
                        type: 'follow_activity',
                        title: 'Someone Followed You',
                        message: 'You have a new follower on your profile.',
                    },
                    {
                        user_id: sampleUsers[0].id,
                        type: 'nft_sold',
                        title: 'NFT Sold',
                        message: 'Your NFT has been sold successfully.',
                        tx_hash: "0x5c596f57bb9b1c1cc0924d1be1fb5c0322b9a82fe8effbba0e587609abe468b0"
                    }
                ], {
                    validate: true,
                    ignoreDuplicates: true
                });

                console.log('✓ Created sample notifications');
            }

            if (sampleUsers.length > 0) {
                await UserNFTFavorites.bulkCreate([
                    {
                        user_id: sampleUsers[0].id,
                        token_id: '1',
                        contract_address: '0x4f3a65a43ed16C3e7772b0319bF9a74dE2083AA2',
                        token_uri: 'https://nft.example.com/metadata/1',
                        is_active: true
                    },
                    {
                        user_id: sampleUsers[1].id,
                        token_id: '2',
                        contract_address: '0xdaf9fa175b92e2e853F92e3D501C44327C9be8ee',
                        token_uri: 'https://nft.example.com/metadata/2',
                        is_active: true
                    }
                ], {
                    validate: true,
                    ignoreDuplicates: true
                });

                console.log('✓ Created sample user_nft_favorites');
            }
        } else {
            console.log(`Database already contains ${userCount} users, skipping seed data`);
        }

        console.log('✓ Database seeding completed');
        return true;
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

export {
    User,
    WalletNonce,
    UserNFTFavorites,
    Notification,
    models,
    syncDatabase,
    seedDatabase
};

export default models;
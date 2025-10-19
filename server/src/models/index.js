"use strict";

// Import all models
import User from './user.model.js';
import UserNFTFavorites from './userNftFavorites.model.js';
import Notification from './notification.model.js';

// Define associations/relationships between models

// User - UserNFTFavorites relationship (1:many)
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

// User - Notification relationship (1:many)
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

// Export all models
const models = {
    User,
    UserNFTFavorites,
    Notification
};

// Function to sync all models with database
const syncDatabase = async (options = {}) => {
    try {
        const { force = false, alter = false } = options;

        console.log('Starting database synchronization...');

        // Sync all models in the correct order (User first, then related models)
        await User.sync({ force, alter });

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

            // Create sample users
            const sampleUsers = await User.bulkCreate([
                {
                    wallet_address: '0x92d84DF75C5A1744Bc10B9Af1aC7d6A569e9CFDc',
                    username: 'cryptoartist',
                    email: 'artist@example.com',
                    bio: 'Digital artist creating unique NFT collections',
                    provider: 'google',
                    provider_id: 'google|12345'
                },
                {
                    wallet_address: '0x630d5f07E25cc6CA59a21dCe330B8E1Fc28dD146',
                    username: 'nftcollector',
                    email: 'collector@example.com',
                    bio: 'Passionate NFT collector and trader',
                    provider: 'google',
                    provider_id: 'google|67890'
                }
            ], {
                validate: true,
                ignoreDuplicates: true
            });

            console.log(`✓ Created ${sampleUsers.length} sample users`);

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
    UserNFTFavorites,
    Notification,
    models,
    syncDatabase,
    seedDatabase
};

export default models;
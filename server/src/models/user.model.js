"use strict";

import { DataTypes } from "sequelize";
import instanceMySQL from "../dbs/init.mysql.js";
import { isAddress } from "ethers";

const sequelize = instanceMySQL.getSequelize();

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: "Unique identifier for user",
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      unique: true,
      validate: {
        isEthereumAddress(value) {
          if (!isAddress(value)) {
            throw new Error('Invalid Ethereum wallet address');
          }
        },
        notEmpty: true
      },
      comment: "Primary Ethereum wallet address (unique, required)"
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100]
      },
      comment: "Display name for the user"
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      },
      comment: "URL to user's avatar image",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Max 1000 characters for bio
      },
      comment: "User biography/description"
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      },
      comment: "User email address (optional)"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Whether the user account is active"
    },
    nonce_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Counter for preventing replay attacks (increments on each login)"
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last login timestamp"
    },
  }, {
  tableName: "users",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['wallet_address']
    },
    {
      unique: true,
      fields: ['email'],
      where: {
        email: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      // Convert wallet address to lowercase for consistency
      if (user.wallet_address) {
        user.wallet_address = user.wallet_address.toLowerCase();
      }

      // Set display name to wallet address if not provided
      user.display_name = user.wallet_address;

    },
    beforeUpdate: async (user) => {
      if (user.changed('wallet_address') && user.wallet_address) {
        user.wallet_address = user.wallet_address.toLowerCase();
      }
    }
  }
});

// Instance methods
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Can expose all data for wallet-based users
  return values;
};

User.prototype.updateLastLogin = async function () {
  this.last_login = new Date();
  this.nonce_count = (this.nonce_count || 0) + 1;
  await this.save();
};

User.prototype.updateStats = async function (statsUpdate) {
  Object.keys(statsUpdate).forEach(key => {
    if (this[key] !== undefined) {
      this[key] = statsUpdate[key];
    }
  });
  await this.save();
  return this;
};

// Class methods
User.findById = async function (id) {
  return await this.findOne({
    where: {
      id,
      is_active: true,
    },
  });
};

User.findByWalletAddress = async function (walletAddress) {
  return await this.findOne({
    where: {
      wallet_address: walletAddress.toLowerCase(),
      is_active: true,
    },
  });
};

User.findByEmail = async function (email) {
  return await this.findOne({
    where: {
      email: email.toLowerCase(),
      is_active: true,
    },
  });
};

User.createOrUpdateUser = async function (walletAddress, userData = {}) {
  const existingUser = await this.findByWalletAddress(walletAddress);

  if (existingUser) {
    // Update last login and nonce count
    await existingUser.updateLastLogin();
    return existingUser;
  }

  // Create new user
  const newUser = await this.create({
    wallet_address: walletAddress,
    ...userData
  });

  return newUser;
};

User.updateUser = async function (id, updateData) {
  const user = await this.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  Object.keys(updateData).forEach(key => {
    if (key !== 'wallet_address') { // Prevent changing wallet address
      user[key] = updateData[key];
    }
  });

  await user.save();
  return user;
};

export default User;

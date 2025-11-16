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
      allowNull: true,
      defaultValue: null,
      unique: true,
      validate: {
        isEthereumAddress(value) {
          // Only validate if value exists
          if (value && !isAddress(value)) {
            throw new Error("Invalid Ethereum wallet address");
          }
        },
      },
      comment: "Ethereum wallet address (unique)",
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
      comment: "Unique username for the user",
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
        len: [0, 500], // Max 500 characters for bio
      },
      comment: "User biography/description",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: "User email address",
    },
    provider: {
      type: DataTypes.ENUM("google"),
      allowNull: false,
      comment: "Authentication provider used",
    },
    provider_id: {
      type: DataTypes.STRING(255),
      unique: true,
      comment: "ID from OAuth provider (Google ID, etc.)",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Whether the user account is active",
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last login timestamp",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["wallet_address"],
      },
      {
        unique: true,
        fields: ["email"],
        where: {
          email: {
            [sequelize.Sequelize.Op.ne]: null,
          },
        },
      },
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Convert wallet address to lowercase for consistency
        if (user.wallet_address) {
          user.wallet_address = user.wallet_address.toLowerCase();
        }
        // Convert username to lowercase
        if (user.username) {
          user.username = user.username.toLowerCase();
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("wallet_address") && user.wallet_address) {
          user.wallet_address = user.wallet_address.toLowerCase();
        }
        if (user.changed("username") && user.username) {
          user.username = user.username.toLowerCase();
        }
      },
    },
  },
);

// Instance methods
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Don't expose sensitive data in JSON
  delete values.provider_id;
  return values;
};

User.prototype.updateLastLogin = async function () {
  this.last_login = new Date();
  await this.save();
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

User.findByUsername = async function (username) {
  return await this.findOne({
    where: {
      username: username.toLowerCase(),
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

User.findByProviderId = async function (provider, providerId) {
  return await this.findOne({
    where: {
      provider: provider,
      provider_id: providerId,
      is_active: true,
    },
  });
};

User.updateUser = async function (id, updateData) {
  const user = await this.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  Object.keys(updateData).forEach((key) => {
    user[key] = updateData[key];
  });

  await user.save();
  return user;
};

User.createUser = async function (userData) {
  const user = await this.create(userData);
  return user;
};

export default User;

import { OK, SuccessResponse } from "../core/success.response.js";
import {
  AuthFailureError,
  BadRequestError,
  ErrorResponse,
} from "../core/error.response.js";
import UserModel from "../models/user.model.js";

class UserController {
  getCurrentUser = async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthFailureError("Not authenticated");
      }

      const user = await UserModel.findById(req.user.id);

      // Exclude sensitive/internal fields from response
      const userData = user.toJSON();
      const { is_active, nonce_count, last_login, ...publicUserData } =
        userData;

      new SuccessResponse({
        message: "User retrieved successfully",
        metadata: {
          user: publicUserData,
        },
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthFailureError("Not authenticated");
      }

      if (req.body == undefined || Object.keys(req.body).length === 0) {
        throw new BadRequestError("No data provided for update");
      }

      const updateData = {};
      if (req.body.display_name !== undefined && req.body.display_name !== "")
        updateData.display_name = req.body.display_name;
      if (req.body.bio !== undefined) updateData.bio = req.body.bio;
      if (req.body.avatar_url !== undefined && req.body.avatar_url !== "")
        updateData.avatar_url = req.body.avatar_url;

      const user = await UserModel.updateUser(req.user.id, updateData);
      new SuccessResponse({
        message: "Profile updated successfully",
        metadata: { user },
      }).send(res);
    } catch (error) {
      if (error.status) next(error); // Forward known errors
      throw new ErrorResponse("Failed to update profile", 500);
    }
  };

  getPublicUserInfoById = async (req, res, next) => {
    try {
      // Support both path param and query param
      const userId = req.params.id || req.query.id;

      if (!userId?.trim()) {
        throw new BadRequestError("User ID is required");
      }

      console.log("Looking up user ID:", userId);

      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
        });
      }

      const userData = user.toJSON();
      const {
        is_active,
        nonce_count,
        last_login,
        wallet_address,
        ...publicUserData
      } = userData;

      new SuccessResponse({
        message: "User retrieved successfully",
        metadata: { user: publicUserData },
      }).send(res);
    } catch (error) {
      console.error("User lookup error:", error);
      next(error);
    }
  };
}

export default new UserController();

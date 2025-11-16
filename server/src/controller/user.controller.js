import { OK, SuccessResponse } from "../core/success.response.js";
import {
  AuthFailureError,
  BadRequestError,
  ErrorResponse,
} from "../core/error.response.js";
import UserModel from "../models/user.model.js";

class UserController {
  getCurrentUser = async (req, res) => {
    try {
      if (!req.user) {
        throw new AuthFailureError("Not authenticated");
      }

      console.log("User", req.user);

      const user = {
        id: req.user.id,
        name: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar_url,
        provider: req.user.provider,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin,
        bio: req.user.bio,
      };

      console.log("LogUser", user);

      new SuccessResponse({
        message: "User retrieved successfully",
        metadata: { user },
      }).send(res);
    } catch (error) {
      throw new AuthFailureError("Failed to get user information");
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
      if (req.body.username !== undefined && req.body.username !== "")
        updateData.username = req.body.username;
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
}

export default new UserController();

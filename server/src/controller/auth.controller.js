import passport from "passport";
import JWTUtils from "../utils/jwt.js";
import config from "../config/config.common.js";
import { OK, SuccessResponse } from "../core/success.response.js";
import { AuthFailureError, ErrorResponse } from "../core/error.response.js";

class AuthController {
  // Initiate Google OAuth
  googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
  });

  // Google OAuth callback
  googleCallback = (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
      if (err) {
        throw new AuthFailureError("Google OAuth error");
      }

      if (!user) {
        throw new AuthFailureError("Google OAuth failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          throw new AuthFailureError("Login failed");
        }

        const token = JWTUtils.generateAccessToken(user);

        res.cookie("accessToken", "Bearer " + token, {
          httpOnly: true,
          secure: config.nodeEnv === "production",
          sameSite: "lax",
          maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        });

        res.redirect(`${config.clientUrl}/auth/success`);
      });
    })(req, res, next);
  };

  logout = async (req, res) => {
    try {
      // Clear session
      req.logout((err) => {
        if (err) {
          throw new ErrorResponse("Failed to logout");
        }
      });

      res.clearCookie("accessToken");
      res.clearCookie("connect.sid");

      new SuccessResponse({
        message: "User logged out successfully",
      }).send(res);
    } catch (error) {
      throw new ErrorResponse("Failed to logout");
    }
  };

  checkAuth = async (req, res) => {
    try {
      const isAuthenticated = req.isAuthenticated() || !!req.user;

      if (isAuthenticated) {
        new SuccessResponse({
          message: "User is authenticated",
          metadata: {
            authenticated: true,
            user: {
              id: req.user.id,
              name: req.user.name,
              email: req.user.email,
              avatar: req.user.avatar,
            },
          },
        }).send(res);
      } else {
        new SuccessResponse({
          statusCode: 401,
          message: "User is not authenticated",
          metadata: { authenticated: false },
        }).send(res);
      }
    } catch (error) {
      throw new ErrorResponse("Failed to check authentication status");
    }
  };
}

export default new AuthController();

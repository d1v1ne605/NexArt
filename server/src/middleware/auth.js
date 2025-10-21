import JWTUtils from '../utils/jwt.js';
import UserModel from '../models/user.model.js';
import { AuthFailureError } from '../core/error.response.js';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const cookieHeader = req.headers['cookie'];
    const token = JWTUtils.extractTokenFromCookie(cookieHeader);

    if (!token) {
      throw new AuthFailureError('Access token required');
    }

    const decoded = JWTUtils.verifyToken(token);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new AuthFailureError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(error);
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const cookieHeader = req.headers['cookie'];
    const token = JWTUtils.extractTokenFromCookie(cookieHeader);

    if (token) {
      const decoded = JWTUtils.verifyToken(token);
      const user = await UserModel.findById(decoded.id);
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export {
  authenticateToken,
  optionalAuth
};
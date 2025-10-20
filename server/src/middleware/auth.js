import JWTUtils from '../utils/jwt.js';
import UserModel from '../models/user.model.js';
import { AuthFailureError } from '../core/error.response.js';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      throw AuthFailureError('Access token required');
    }

    const decoded = JWTUtils.verifyToken(token);

    // Get user from database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw AuthFailureError('User not found');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(error);
  }
};

// Middleware to check if user is authenticated via session (for OAuth)
const requireAuth = (req, res, next) => {
  console.log('requireAuth middleware invoked', req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  }

  next(new AuthFailureError('Please log in to access this resource'));
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = JWTUtils.extractTokenFromHeader(authHeader);

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
  requireAuth,
  optionalAuth
};
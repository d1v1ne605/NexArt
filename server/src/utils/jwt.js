import jwt from 'jsonwebtoken';
import config from '../config/config.common.js';

class JWTUtils {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Generate access token for user
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider
    };

    return this.generateToken(payload);
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '30d' // Refresh token lasts longer
    });
  }

  // Extract token from request header
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}

export default new JWTUtils();
import jwt from 'jsonwebtoken';
import config from '../config/config.common.js';
import { BadRequestError } from '../core/error.response.js';

class JWTUtils {
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new BadRequestError('Invalid or expired token');
    }
  }

  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    return this.generateToken(payload);
  }

  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '30d'
    });
  }

  extractTokenFromCookie(cookieHeader) {
    if (!cookieHeader) {
      return null;
    }
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    const token = cookies.cookie || cookies.accessToken;
    if (!token) {
      return null;
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      return token.substring(7);
    }

    return token;
  }
}

export default new JWTUtils();
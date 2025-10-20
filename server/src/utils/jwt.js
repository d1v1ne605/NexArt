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
      name: user.name,
      provider: user.provider
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

    // Parse cookies from header
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    const accessToken = cookies.accessToken;
    if (!accessToken) {
      return null;
    }

    if (accessToken.startsWith('Bearer ')) {
      return accessToken.substring(7);
    }

    return accessToken;
  }
}

export default new JWTUtils();
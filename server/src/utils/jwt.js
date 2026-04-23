import jwt from "jsonwebtoken";
import config from "../config/config.common.js";
import { BadRequestError } from "../core/error.response.js";

class JWTUtils {
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new BadRequestError("Invalid or expired token");
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
      type: "refresh",
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: "30d",
    });
  }

  extractTokenFromCookie(cookieHeader) {
    if (!cookieHeader) return null;

    // 1. Parse chuỗi cookie header thành object
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    // 2. Lấy token theo ĐÚNG tên bạn đã đặt khi login
    // Kiểm tra xem bạn lưu cookie tên là 'accessToken', 'token', hay 'authorization'?
    // Ưu tiên check 'accessToken' trước (khớp với code cũ của bạn)
    let token = cookies.accessToken || cookies.token || cookies.Authorization;

    if (!token) return null;

    // 3. Xử lý trường hợp token bị dính prefix 'Bearer ' (thường thấy nếu cookie set ẩu)
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    // 4. Xử lý trường hợp token bị dính ngoặc kép (do JSON.stringify)
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }

    return token;
  }
}

export default new JWTUtils();

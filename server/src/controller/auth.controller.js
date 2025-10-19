import passport from 'passport';
import JWTUtils from '../utils/jwt.js';
import User from '../models/User.js';
import config from '../config/config.js';
import { OK, SuccessResponse } from '../core/success.response.js';
import { AuthFailureError, ErrorResponse } from '../core/error.response.js';

class AuthController {
    // Initiate Google OAuth
    googleAuth = passport.authenticate('google', {
        scope: ['profile', 'email']
    });

    // Google OAuth callback
    googleCallback = (req, res, next) => {
        passport.authenticate('google', (err, user, info) => {
            if (err) {
                throw new AuthFailureError('Google OAuth error');
            }

            if (!user) {
                throw new AuthFailureError('Google OAuth failed');
            }

            // Log the user in
            req.logIn(user, (err) => {
                if (err) {
                    throw new AuthFailureError('Login failed');
                }

                // Generate JWT token
                const token = JWTUtils.generateAccessToken(user);

                // Set secure cookies
                res.cookie('accessToken', token, {
                    httpOnly: true,
                    secure: config.nodeEnv === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                // return to client with success
                new OK({
                    message: 'User logged in successfully',
                    metadata: { user: user }
                }).send(res);
            });
        })(req, res, next);
    };

    // Get current user
    getCurrentUser = async (req, res) => {
        try {
            if (!req.user) {
                throw new AuthFailureError('Not authenticated');
            }

            const user = {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar,
                provider: req.user.provider,
                createdAt: req.user.createdAt,
                lastLogin: req.user.lastLogin
            };

            new SuccessResponse({
                message: 'User retrieved successfully',
                metadata: { user }
            }).send(res);
        } catch (error) {
            throw new AuthFailureError('Failed to get user information');
        }
    };

    // Logout user
    logout = async (req, res) => {
        try {
            // Clear session
            req.logout((err) => {
                if (err) {
                    console.error('Logout error:', err);
                }
            });

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('connect.sid'); // Clear session cookie

            new SuccessResponse({
                message: 'User logged out successfully'
            }).send(res);
        } catch (error) {
            throw new ErrorResponse('Failed to logout');
        }
    };

    // Check authentication status
    checkAuth = async (req, res) => {
        try {
            const isAuthenticated = req.isAuthenticated() || !!req.user;

            if (isAuthenticated) {
                new SuccessResponse({
                    message: 'User is authenticated',
                    metadata: {
                        authenticated: true,
                        user: {
                            id: req.user.id,
                            name: req.user.name,
                            email: req.user.email,
                            avatar: req.user.avatar
                        }
                    }
                }).send(res);
            } else {
                new SuccessResponse({
                    message: 'User is not authenticated',
                    metadata: { authenticated: false }
                }).send(res);
            }
        } catch (error) {
            throw new ErrorResponse('Failed to check authentication status');
        }
    };
}

export default new AuthController();
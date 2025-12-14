import express from 'express';
const router = express.Router();
import FavoriteController from '../../controller/favorite.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

/**
 * @route POST /favorite/add
 * @desc Add NFT to favorites
 * @access Private
 * @body {contract_address, token_id, token_uri}
 */
router.post('/add', authenticateToken, FavoriteController.addToFavorites);

/**
 * @route GET /favorite/my
 * @desc Get my favorites with pagination
 * @access Private
 * @query {page, limit}
 */
router.get('/my', authenticateToken, FavoriteController.getMyFavorites);

/**
 * @route DELETE /favorite/remove
 * @desc Remove NFT from favorites
 * @access Private
 * @body {contract_address, token_id}
 */
router.delete('/remove', authenticateToken, FavoriteController.removeFromFavorites);

/**
 * @route GET /favorite/check/user_id=&contract_address=&token_id=
 * @desc Check if NFT is in user's favorites
 * @access Private
 * @query {userid, contract_address, token_id}
 */
router.get('/check', authenticateToken, FavoriteController.isFavorite);

export default router;
import { OK, SuccessResponse } from '../core/success.response.js';
import { AuthFailureError, BadRequestError, NotFoundError } from '../core/error.response.js';
import UserNFTFavorites from '../models/userNftFavorites.model.js';

class FavoriteController {
    /**
     * @route POST /favorite/add
     * @desc Add NFT to favorites
     * @access Private
     * @body {contract_address, token_id, token_uri}
     */
    addToFavorites = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthFailureError('Not authenticated');
            }

            const { contract_address, token_id, token_uri } = req.body;

            if (!contract_address || !token_id) {
                throw new BadRequestError('Contract address and token ID are required');
            }

            const favorite = await UserNFTFavorites.addFavorite(
                req.user.id,
                contract_address,
                token_id,
                token_uri
            );

            new SuccessResponse({
                message: 'NFT added to favorites successfully',
                metadata: {
                    favorite: favorite.toJSON()
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @route GET /favorite/my
     * @desc Get my favorites with pagination
     * @access Private
     * @query {page, limit}
     */
    getMyFavorites = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthFailureError('Not authenticated');
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const result = await UserNFTFavorites.getUserFavorites(req.user.id, {
                limit,
                offset
            });

            const totalPages = Math.ceil(result.count / limit);

            new SuccessResponse({
                message: 'Favorites retrieved successfully',
                metadata: {
                    favorites: result.rows,
                    pagination: {
                        current_page: page,
                        per_page: limit,
                        total: result.count,
                        total_pages: totalPages,
                        has_next: page < totalPages,
                        has_prev: page > 1
                    }
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @route DELETE /favorite/remove
     * @desc Remove NFT from favorites
     * @access Private
     * @body {contract_address, token_id}
     */
    removeFromFavorites = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthFailureError('Not authenticated');
            }

            const { contract_address, token_id } = req.body;

            if (!contract_address || !token_id) {
                throw new BadRequestError('Contract address and token ID are required');
            }

            const favorite = await UserNFTFavorites.removeFavorite(
                req.user.id,
                contract_address,
                token_id
            );

            if (!favorite) {
                throw new NotFoundError('Favorite not found');
            }

            new SuccessResponse({
                message: 'NFT removed from favorites successfully',
                metadata: {
                    favorite: favorite.toJSON()
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }

    /**
     * @route GET /favorite/check/user_id=&contract_address=&token_id=
     * @desc Check if NFT is in user's favorites
     * @access Private
     * @query {user_id, contract_address, token_id}
     */
    isFavorite = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new AuthFailureError('Not authenticated');
            }

            const { user_id, contract_address, token_id } = req.query;

            if (!user_id || !contract_address || !token_id) {
                throw new BadRequestError('User ID, contract address, and token ID are required');
            }

            const isFav = await UserNFTFavorites.isFavorite(
                user_id,
                contract_address,
                token_id
            );

            new SuccessResponse({
                message: 'Favorite check completed successfully',
                metadata: {
                    is_favorite: isFav
                }
            }).send(res);

        } catch (error) {
            next(error);
        }
    }
}

export default new FavoriteController();
import express from 'express';
const router = express.Router();
import { authenticateToken, requireAuth, optionalAuth } from '../../middleware/auth.js';
import {asyncHandler}  from "../../helpers/asyncHandler.js"

router.get("/", asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Auth route is working!"
    });
}));

export default router;
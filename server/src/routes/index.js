"use strict";
import express from "express";
const router = express.Router();

// import authRoutes from "./auth/index.js";
import walletAuthRoutes from "./auth/index.js";
import userRoutes from "./user/index.js";
import notificationRoutes from "./notifications/index.js";

router.use('/auth', walletAuthRoutes);
router.use('/user', userRoutes);
router.use('/notifications', notificationRoutes);

export default router;
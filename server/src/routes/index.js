"use strict";
import express from "express";
const router = express.Router();

import authRoutes from "./auth/index.js";
import userRoutes from "./user/index.js";
import notificationRoutes from "./notifications/index.js";

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/notifications', notificationRoutes);

export default router;
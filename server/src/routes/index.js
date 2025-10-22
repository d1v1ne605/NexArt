"use strict";
import express from "express";
const router = express.Router();

import authRoutes from "./auth/index.js";
import userRoutes from "./user/index.js";

router.use('/auth', authRoutes);
router.use('/user', userRoutes);

export default router;
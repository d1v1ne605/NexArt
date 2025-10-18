"use strict";
import express from "express";
const router = express.Router();

import authRoutes from "./auth/index.js";

// router.use("/test", import("./test"));
router.use('/auth', authRoutes);

export default router;
"use strict";
const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../../helpers/asyncHandler")

router.get("/", asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Test route is working!"
    });
}));
module.exports = router;
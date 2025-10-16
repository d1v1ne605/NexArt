const express = require("express");
require("dotenv").config();
const app = express();
const path = require("path");

// init middlewares
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);


// init routes
app.use("/v1/api", require("./routes"));

// handling errors
app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    const resMessage = `${error.status} - ${Date.now() - error.now}ms - Response: ${JSON.stringify(error)}`
    
    return res.status(statusCode).json({
        status: "error",
        code: statusCode,
        message: error.message || "Internal Server Error",
        file: error.stack.split('\n')
    });
});

module.exports = app;
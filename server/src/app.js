import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

// Import Route
import routes from "./routes/index.js"

// Load environment variables
dotenv.config()

// Import configurations
import config from './config/config.js'
import passport from './config/passport.js'

// Create Express app
const app = express();

// Trust proxy (important for production with reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS middleware
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// Cookie parsing middleware
app.use(cookieParser());

// Session middleware (required for Passport)
app.use(session(config.session));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// init db
import "./dbs/init.mysql.js";
import { syncDatabase } from './models/index.js';
await syncDatabase();

// init routes
app.use("/v1/api", routes);

// handling errors
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const resMessage = `${error.status} - ${Date.now() - error.now}ms - Response: ${JSON.stringify(error)}`
  // myLogger.error(resMessage, [
  //   req.path,
  //   {
  //     requestId: req.requestId
  //   },
  //   {
  //     message: error.message
  //   }
  // ])
  console.error(resMessage, {
    path: req.path,
    requestId: req.requestId,
    stack: error.stack
  });

  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message || "Internal Server Error",
    file: error.stack.split('\n')
  });
});

export default app;
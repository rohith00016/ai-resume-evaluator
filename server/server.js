const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

// Import configurations
const connectDB = require("./config/database");
const corsOptions = require("./config/cors");
const { apiLimiter, authLimiter } = require("./config/rateLimiter");
const validateEnv = require("./config/envValidator");
const logger = require("./utils/logger");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const requestId = require("./middleware/requestId");

// Import routes
const resumeRoutes = require("./routes/resumeRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Trust proxy - Required for Render.com and rate limiting
app.set('trust proxy', true);

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  logger.error("Environment validation failed:", error);
  process.exit(1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS
const cors = require("cors");
app.use(cors(corsOptions));

// Request ID middleware (must be early)
app.use(requestId);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Routes
app.use("/api", resumeRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip,
  });
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  // Don't exit in production, let the process manager handle it
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        port: PORT,
      });
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Store server reference for graceful shutdown
    app.locals.server = server;
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

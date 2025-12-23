const multer = require("multer");
const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log error with request context
  logger.error("Request error:", {
    requestId: req.id,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    ip: req.ip,
  });

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File size must be under 5MB",
      });
    }
    return res.status(400).json({
      error: "File upload error",
      details: err.message,
    });
  }

  // File type validation errors
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({
      error: "Only PDF files are allowed",
    });
  }

  // PDF parsing errors
  if (err.message.includes("Could not extract text")) {
    return res.status(422).json({
      error: err.message,
    });
  }

  // AI service errors
  if (
    err.message.includes("GoogleGenerativeAI") ||
    err.message.includes("Max retries exceeded") ||
    err.message.includes("quota")
  ) {
    return res.status(503).json({
      error:
        "AI service temporarily unavailable due to quota limits. Please try again later.",
    });
  }

  // MongoDB errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;

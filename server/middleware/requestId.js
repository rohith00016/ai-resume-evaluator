const { v4: uuidv4 } = require("uuid");

/**
 * Middleware to add a unique request ID to each request
 * This helps with tracing requests through logs
 */
const requestId = (req, res, next) => {
  req.id = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-ID", req.id);
  next();
};

module.exports = requestId;


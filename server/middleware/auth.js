const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes by verifying JWT token
 * Reads token from Authorization header and attaches user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer '
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Verify token using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from decoded token (exclude password)
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token failed - User not found",
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error("JWT verification error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed - Invalid token",
      });
    }
  }

  // If no token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed - No token provided",
    });
  }
};

/**
 * Middleware to authorize users based on their role
 * @param {string} role - The required role (e.g., 'admin', 'user')
 * @returns {Function} Express middleware function
 */
const authorize = (role) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed - User not authenticated",
      });
    }

    // Check if user has the required role
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    next();
  };
};

/**
 * Middleware to authorize multiple roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed - User not authenticated",
      });
    }

    // Check if user has any of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  authorizeRoles,
};

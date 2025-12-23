const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        error: "User already exists with this email or username",
      });
    }

    // Determine role based on admin code
    let role = "user";
    if (adminCode && adminCode === process.env.ADMIN_REGISTRATION_CODE) {
      role = "admin";
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({
        error: "Invalid user data",
      });
    }
  } catch (error) {
    logger.error("Register error", {
      requestId: req.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Server error during registration",
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error("Login error", {
      requestId: req.id,
      email: req.body.email,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Server error during login",
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .lean();
    res.json(user);
  } catch (error) {
    logger.error("Get me error", {
      requestId: req.id,
      userId: req.user.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Server error",
    });
  }
};

// @desc    Promote user to admin (admin only)
// @route   PUT /api/auth/promote/:userId
// @access  Private (Admin only)
const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Update user role to admin
    user.role = "admin";
    await user.save();

    res.json({
      message: "User promoted to admin successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Promote to admin error", {
      requestId: req.id,
      userId: req.params.userId,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Server error",
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .lean();
    res.json(users);
  } catch (error) {
    logger.error("Get all users error", {
      requestId: req.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  promoteToAdmin,
  getAllUsers,
};

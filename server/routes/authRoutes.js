const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

// Validation middleware
const validateRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post(
  "/register",
  validateRegistration,
  handleValidationErrors,
  authController.registerUser
);
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  authController.loginUser
);
router.get("/me", protect, authController.getMe);
router.get("/users", protect, authorize("admin"), authController.getAllUsers);
router.put(
  "/promote/:userId",
  protect,
  authorize("admin"),
  authController.promoteToAdmin
);

module.exports = router;

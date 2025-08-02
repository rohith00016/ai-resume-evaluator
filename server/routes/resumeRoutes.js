const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  validateResumeSubmission,
  validateEmailRequest,
  handleValidationErrors,
} = require("../middleware/validation");
const resumeController = require("../controllers/resumeController");

// POST /api/resume - Upload and evaluate resume
router.post(
  "/resume",
  upload.single("resume"),
  validateResumeSubmission,
  handleValidationErrors,
  resumeController.uploadAndEvaluate
);

// GET /api/learners - Get all evaluations
router.get("/learners", resumeController.getAllEvaluations);

// POST /api/send-feedback - Send feedback email
router.post(
  "/send-feedback",
  validateEmailRequest,
  handleValidationErrors,
  resumeController.sendFeedbackEmail
);

module.exports = router;

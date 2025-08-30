const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  validateResumeSubmission,
  validatePortfolioSubmission,
  validateEmailRequest,
  handleValidationErrors,
} = require("../middleware/validation");
const { protect, authorize } = require("../middleware/auth");
const resumeController = require("../controllers/resumeController");

// POST /api/resumes - Upload and evaluate resume only (requires authentication)
router.post(
  "/resumes",
  protect,
  upload.single("resume"),
  validateResumeSubmission,
  handleValidationErrors,
  resumeController.createResumeSubmission
);

// POST /api/portfolios - Submit and evaluate portfolio only (requires authentication)
router.post(
  "/portfolios",
  protect,
  validatePortfolioSubmission,
  handleValidationErrors,
  resumeController.createPortfolioSubmission
);

// GET /api/learners - Get evaluations (role-based access)
router.get("/learners", protect, resumeController.getLearners);

// GET /api/learners/:id - Get single evaluation by ID (role-based access)
router.get("/learners/:id", protect, resumeController.getLearnerById);

// POST /api/send-feedback - Send feedback email (admin only)
router.post(
  "/send-feedback",
  protect,
  authorize("admin"),
  validateEmailRequest,
  handleValidationErrors,
  resumeController.sendFeedbackEmail
);

// Legacy endpoint for backward compatibility
router.post(
  "/resume",
  protect,
  upload.single("resume"),
  validateResumeSubmission,
  handleValidationErrors,
  resumeController.createLearner
);

// Test endpoint for email service (development only)
if (process.env.NODE_ENV === "development") {
  router.post("/test-email", protect, authorize("admin"), async (req, res) => {
    try {
      const emailService = require("../services/emailService");
      await emailService.sendFeedbackEmail({
        name: "Test User",
        email: req.body.testEmail || "test@example.com",
        resumeFeedback: "This is a test feedback message.",
        resumeScore: 8.5,
        resumeUrl: "https://example.com/resume.pdf",
      });
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = router;

const { body, validationResult } = require("express-validator");

const validateResumeSubmission = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage("Name must be between 2 and 40 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain alphabetic characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("course")
    .trim()
    .isIn(["MERN", "UXUI", "Devops"])
    .withMessage("Course must be either MERN, UXUI, or Devops"),
];

const validateEmailRequest = [
  body("evaluationId").isMongoId().withMessage("Invalid evaluation ID"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

module.exports = {
  validateResumeSubmission,
  validateEmailRequest,
  handleValidationErrors,
};

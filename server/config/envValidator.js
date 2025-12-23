/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
const logger = require("../utils/logger");

const validateEnv = () => {
  // Core required variables
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "GEMINI_API_KEY",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_SES_FROM_EMAIL",
    "ADMIN_REGISTRATION_CODE",
  ];

  // Cloudinary variables (required if cloudinary.js is used)
  // Note: Currently Cloudinary upload is skipped, but config file exists
  const cloudinaryRequired = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  // Check core required variables
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Check Cloudinary variables (warn if missing but don't fail)
  const missingCloudinary = cloudinaryRequired.filter(
    (key) => !process.env[key]
  );

  if (missingCloudinary.length > 0) {
    logger.warn(
      `Cloudinary variables missing (may be optional): ${missingCloudinary.join(", ")}`
    );
  }

  // Validate JWT_SECRET strength in production
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }

    // Validate ADMIN_REGISTRATION_CODE strength in production
    if (process.env.ADMIN_REGISTRATION_CODE.length < 8) {
      throw new Error(
        "ADMIN_REGISTRATION_CODE must be at least 8 characters in production"
      );
    }
  }

  // Validate AWS_REGION format
  const validRegions = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "eu-west-1",
    "eu-west-2",
    "eu-central-1",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
  ];
  if (
    process.env.AWS_REGION &&
    !validRegions.includes(process.env.AWS_REGION)
  ) {
    logger.warn(
      `AWS_REGION "${process.env.AWS_REGION}" may not be valid. Common regions: ${validRegions.join(", ")}`
    );
  }

  // Validate email format for AWS_SES_FROM_EMAIL
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    process.env.AWS_SES_FROM_EMAIL &&
    !emailRegex.test(process.env.AWS_SES_FROM_EMAIL)
  ) {
    throw new Error("AWS_SES_FROM_EMAIL must be a valid email address");
  }

  // Validate MONGO_URI format
  if (
    process.env.MONGO_URI &&
    !process.env.MONGO_URI.startsWith("mongodb://") &&
    !process.env.MONGO_URI.startsWith("mongodb+srv://")
  ) {
    throw new Error(
      "MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'"
    );
  }

  logger.info("Environment variables validated", {
    validated: required.length,
    cloudinaryConfigured: missingCloudinary.length === 0,
  });
};

module.exports = validateEnv;


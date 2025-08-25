const mongoose = require("mongoose");

const LearnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [40, "Name cannot exceed 40 characters"],
      match: [/^[a-zA-Z\s]+$/, "Name can only contain alphabetic characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      enum: {
        values: ["MERN", "UXUI", "Devops"],
        message: "Course must be either MERN, UXUI, or Devops",
      },
    },
    resumePublicId: {
      type: String,
    },
    resumeUrl: {
      type: String,
    },
    resumeFeedback: {
      type: String,
    },
    resumeScore: {
      type: Number,
      min: [0, "Score cannot be less than 0"],
      max: [10, "Score cannot be more than 10"],
      default: 5.0,
    },
    portfolioUrl: {
      type: String,
    },
    portfolioFeedback: {
      type: String,
    },
    portfolioScore: {
      type: Number,
      min: [0, "Score cannot be less than 0"],
      max: [10, "Score cannot be more than 10"],
      default: 5.0,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
LearnerSchema.index({ email: 1, createdAt: -1 });
LearnerSchema.index({ resumeScore: -1 });
LearnerSchema.index({ portfolioScore: -1 });

module.exports = mongoose.model("Learner", LearnerSchema);
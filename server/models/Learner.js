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
    resumePublicId: {
      type: String,
      required: [true, "Resume public ID is required"],
    },
    resumeUrl: {
      type: String,
      required: [true, "Resume URL is required"],
    },
    feedback: {
      type: String,
      required: [true, "Feedback is required"],
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [0, "Score cannot be less than 0"],
      max: [10, "Score cannot be more than 10"],
      default: 5.0,
    },
    prompt: {
      type: String,
      required: [true, "Evaluation prompt is required"],
      minlength: [10, "Prompt must be at least 10 characters"],
      maxlength: [500, "Prompt cannot exceed 500 characters"],
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
LearnerSchema.index({ score: -1 });

module.exports = mongoose.model("Learner", LearnerSchema);

const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const aiService = require("../services/aiService");
const emailService = require("../services/emailService");
const Learner = require("../models/Learner");

class ResumeController {
  async createLearner(req, res, next) {
    try {
      const { name, course, portfolioUrl } = req.body;
      const email = req.user.email; // Use authenticated user's email

      if (!course) {
        return res.status(400).json({ error: "Course is required" });
      }

      // Set submittedBy from authenticated user
      const submittedBy = req.user.id;

      let resumeResult = null;
      let portfolioResult = null;
      let uploadResult = null;

      // Resume Evaluation if file present
      if (req.file) {
        const resumeData = await pdfParse(req.file.buffer);
        const resumeText = resumeData.text;

        if (!resumeText || resumeText.trim().length === 0) {
          throw new Error("Could not extract text from PDF.");
        }

        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              format: "pdf",
              folder: "resumes",
              public_id: `${Date.now()}-${name.replace(/\s+/g, "-")}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });

        const { feedback, score } = await aiService.evaluateResume(
          resumeText,
          course
        );
        resumeResult = { feedback, score };
      }

      // Portfolio Evaluation if URL present
      if (portfolioUrl && portfolioUrl.startsWith("http")) {
        const { feedback, score } = await aiService.evaluatePortfolio(
          portfolioUrl,
          course
        );
        portfolioResult = { feedback, score };
      }

      // If nothing to evaluate
      if (!resumeResult && !portfolioResult) {
        return res
          .status(400)
          .json({ error: "Provide a resume file or valid portfolio URL" });
      }

      // Save or update learner
      const learner = await Learner.findOneAndUpdate(
        { email, course, submittedBy },
        {
          $setOnInsert: { name, submittedBy },
          ...(resumeResult && {
            resumeUrl: uploadResult.secure_url,
            resumePublicId: uploadResult.public_id,
            resumeFeedback: resumeResult.feedback,
            resumeScore: resumeResult.score,
          }),
          ...(portfolioResult && {
            portfolioUrl,
            portfolioFeedback: portfolioResult.feedback,
            portfolioScore: portfolioResult.score,
          }),
        },
        { upsert: true, new: true }
      );

      // Send confirmation email to user
      try {
        await emailService.sendSubmissionConfirmation({
          name,
          email,
          course,
        });
        console.log(`Confirmation email sent to ${email} for ${name}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }

      // Automatically send feedback email after evaluation
      try {
        console.log("Preparing to send automatic feedback email...");

        // Prepare evaluation data for email
        const evaluationData = {
          name,
          email,
          course,
          ...(resumeResult && {
            resumeFeedback: resumeResult.feedback,
            resumeScore: resumeResult.score,
            resumeUrl: uploadResult.secure_url,
          }),
          ...(portfolioResult && {
            portfolioFeedback: portfolioResult.feedback,
            portfolioScore: portfolioResult.score,
            portfolioUrl: portfolioUrl,
          }),
        };

        console.log("Evaluation data prepared:", {
          name: evaluationData.name,
          email: evaluationData.email,
          hasResumeFeedback: !!evaluationData.resumeFeedback,
          hasPortfolioFeedback: !!evaluationData.portfolioFeedback,
        });

        // Send feedback email
        await emailService.sendFeedbackEmail(evaluationData);
        console.log(`Feedback email sent to ${email} for ${name}`);

        // Update the learner record to mark email as sent
        await Learner.findByIdAndUpdate(learner._id, {
          emailSent: true,
          emailSentAt: new Date(),
        });
        console.log(`Database updated: emailSent=true for ${name}`);
      } catch (feedbackEmailError) {
        console.error("Failed to send feedback email:", feedbackEmailError);
        console.error("Error details:", {
          message: feedbackEmailError.message,
          stack: feedbackEmailError.stack,
        });
        // Don't fail the request if email fails, but log the error
        // The admin can manually resend the email later
      }

      // Fetch the updated learner record to get the email status
      const updatedLearner = await Learner.findById(learner._id)
        .populate("submittedBy", "username email")
        .select(
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore resumeUrl createdAt emailSent emailSentAt submittedBy"
        );

      res.status(201).json({
        message: "Evaluation completed",
        learner: {
          _id: updatedLearner._id,
          name: updatedLearner.name,
          email: updatedLearner.email,
          course: updatedLearner.course,
          ...(resumeResult && {
            resumeFeedback: resumeResult.feedback,
            resumeScore: resumeResult.score,
            resumeUrl: uploadResult.secure_url,
          }),
          ...(portfolioResult && {
            portfolioFeedback: portfolioResult.feedback,
            portfolioScore: portfolioResult.score,
            portfolioUrl: portfolioUrl,
          }),
          emailSent: updatedLearner.emailSent,
          emailSentAt: updatedLearner.emailSentAt,
          createdAt: updatedLearner.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearners(req, res, next) {
    try {
      let query = {};

      // Role-based filtering
      if (req.user.role === "user") {
        // Users can only see their own submissions
        query.submittedBy = req.user.id;
      }
      // Admins can see all submissions (no additional filter needed)

      // Get learners with role-based filtering
      const learners = await Learner.find(query)
        .populate("submittedBy", "username email")
        .select(
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore resumeUrl createdAt emailSent emailSentAt submittedBy"
        )
        .sort({ createdAt: -1 });

      res.json(learners);
    } catch (error) {
      next(error);
    }
  }

  async getLearnerById(req, res, next) {
    try {
      const { id } = req.params;
      let query = { _id: id };

      // Role-based filtering
      if (req.user.role === "user") {
        // Users can only see their own submissions
        query.submittedBy = req.user.id;
      }
      // Admins can see all submissions (no additional filter needed)

      // Get learner with role-based filtering
      const learner = await Learner.findOne(query)
        .populate("submittedBy", "username email")
        .select(
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore resumeUrl createdAt emailSent emailSentAt submittedBy"
        );

      if (!learner) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      res.json(learner);
    } catch (error) {
      next(error);
    }
  }

  // Alias for backward compatibility
  async uploadAndEvaluateSubmission(req, res, next) {
    return this.createLearner(req, res, next);
  }

  // Alias for backward compatibility
  async getAllEvaluations(req, res, next) {
    return this.getLearners(req, res, next);
  }

  async createResumeSubmission(req, res, next) {
    try {
      const { name, course } = req.body;
      const email = req.user.email; // Use authenticated user's email

      if (!course || !req.file) {
        return res.status(400).json({
          error: "Course and resume file are required",
        });
      }

      // Set submittedBy from authenticated user
      const submittedBy = req.user.id;

      // Parse PDF and extract text
      const resumeData = await pdfParse(req.file.buffer);
      const resumeText = resumeData.text;

      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("Could not extract text from PDF.");
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            format: "pdf",
            folder: "resumes",
            public_id: `${Date.now()}-${name.replace(/\s+/g, "-")}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Generate AI feedback for resume
      const { feedback, score } = await aiService.evaluateResume(
        resumeText,
        course
      );

      // Create new learner document
      const learner = new Learner({
        name,
        email,
        course,
        submittedBy,
        resumeUrl: uploadResult.secure_url,
        resumePublicId: uploadResult.public_id,
        resumeFeedback: feedback,
        resumeScore: score,
      });

      await learner.save();

      // Send confirmation email to user
      try {
        await emailService.sendSubmissionConfirmation({
          name,
          email,
          course,
        });
        console.log(`Confirmation email sent to ${email} for ${name}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }

      // Automatically send feedback email after evaluation
      try {
        console.log("Preparing to send automatic resume feedback email...");

        const evaluationData = {
          name,
          email,
          course,
          resumeFeedback: feedback,
          resumeScore: score,
          resumeUrl: uploadResult.secure_url,
        };

        console.log("Resume evaluation data prepared:", {
          name: evaluationData.name,
          email: evaluationData.email,
          hasResumeFeedback: !!evaluationData.resumeFeedback,
        });

        // Send feedback email
        await emailService.sendFeedbackEmail(evaluationData);
        console.log(`Resume feedback email sent to ${email} for ${name}`);

        // Update the learner record to mark email as sent
        await Learner.findByIdAndUpdate(learner._id, {
          emailSent: true,
          emailSentAt: new Date(),
        });
        console.log(`Database updated: emailSent=true for ${name}`);
      } catch (feedbackEmailError) {
        console.error(
          "Failed to send resume feedback email:",
          feedbackEmailError
        );
        console.error("Error details:", {
          message: feedbackEmailError.message,
          stack: feedbackEmailError.stack,
        });
        // Don't fail the request if email fails, but log the error
        // The admin can manually resend the email later
      }

      // Fetch the updated learner record to get the email status
      const updatedLearner = await Learner.findById(learner._id)
        .populate("submittedBy", "username email")
        .select(
          "_id name email course resumeUrl resumeFeedback resumeScore createdAt emailSent emailSentAt submittedBy"
        );

      res.status(201).json({
        message: "Resume evaluation completed",
        learner: {
          _id: updatedLearner._id,
          name: updatedLearner.name,
          email: updatedLearner.email,
          course: updatedLearner.course,
          resumeFeedback: feedback,
          resumeScore: score,
          resumeUrl: uploadResult.secure_url,
          emailSent: updatedLearner.emailSent,
          emailSentAt: updatedLearner.emailSentAt,
          createdAt: updatedLearner.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createPortfolioSubmission(req, res, next) {
    try {
      const { name, course, portfolioUrl } = req.body;
      const email = req.user.email; // Use authenticated user's email

      if (!course || !portfolioUrl) {
        return res.status(400).json({
          error: "Course and portfolio URL are required",
        });
      }

      if (!portfolioUrl.startsWith("http")) {
        return res.status(400).json({
          error: "Portfolio URL must be a valid HTTP/HTTPS URL",
        });
      }

      // Set submittedBy from authenticated user
      const submittedBy = req.user.id;

      // Generate AI feedback for portfolio
      const { feedback, score } = await aiService.evaluatePortfolio(
        portfolioUrl,
        course
      );

      // Create new learner document
      const learner = new Learner({
        name,
        email,
        course,
        submittedBy,
        portfolioUrl,
        portfolioFeedback: feedback,
        portfolioScore: score,
      });

      await learner.save();

      // Send confirmation email to user
      try {
        await emailService.sendSubmissionConfirmation({
          name,
          email,
          course,
        });
        console.log(`Confirmation email sent to ${email} for ${name}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }

      // Automatically send feedback email after evaluation
      try {
        console.log("Preparing to send automatic portfolio feedback email...");

        const evaluationData = {
          name,
          email,
          course,
          portfolioFeedback: feedback,
          portfolioScore: score,
          portfolioUrl: portfolioUrl,
        };

        console.log("Portfolio evaluation data prepared:", {
          name: evaluationData.name,
          email: evaluationData.email,
          hasPortfolioFeedback: !!evaluationData.portfolioFeedback,
        });

        // Send feedback email
        await emailService.sendFeedbackEmail(evaluationData);
        console.log(`Portfolio feedback email sent to ${email} for ${name}`);

        // Update the learner record to mark email as sent
        await Learner.findByIdAndUpdate(learner._id, {
          emailSent: true,
          emailSentAt: new Date(),
        });
        console.log(`Database updated: emailSent=true for ${name}`);
      } catch (feedbackEmailError) {
        console.error(
          "Failed to send portfolio feedback email:",
          feedbackEmailError
        );
        console.error("Error details:", {
          message: feedbackEmailError.message,
          stack: feedbackEmailError.stack,
        });
        // Don't fail the request if email fails, but log the error
        // The admin can manually resend the email later
      }

      // Fetch the updated learner record to get the email status
      const updatedLearner = await Learner.findById(learner._id)
        .populate("submittedBy", "username email")
        .select(
          "_id name email course portfolioUrl portfolioFeedback portfolioScore createdAt emailSent emailSentAt submittedBy"
        );

      res.status(201).json({
        message: "Portfolio evaluation completed",
        learner: {
          _id: updatedLearner._id,
          name: updatedLearner.name,
          email: updatedLearner.email,
          course: updatedLearner.course,
          portfolioUrl: updatedLearner.portfolioUrl,
          portfolioFeedback: feedback,
          portfolioScore: score,
          emailSent: updatedLearner.emailSent,
          emailSentAt: updatedLearner.emailSentAt,
          createdAt: updatedLearner.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendFeedbackEmail(req, res, next) {
    try {
      const { evaluationId } = req.body;

      // Find evaluation
      const evaluation = await Learner.findById(evaluationId);
      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      // Send email using the emailService instance
      await emailService.sendFeedbackEmail(evaluation);

      // Update evaluation status
      evaluation.emailSent = true;
      evaluation.emailSentAt = new Date();
      await evaluation.save();

      res.json({
        message: "Email sent successfully",
        evaluationId: evaluation._id,
      });
    } catch (error) {
      console.error("Error sending feedback email:", error);
      res.status(500).json({
        error: "Failed to send email",
        details: error.message,
      });
    }
  }
}

module.exports = new ResumeController();

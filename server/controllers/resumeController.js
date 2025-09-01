const pdfParse = require("pdf-parse");
const aiService = require("../services/aiService");
const emailService = require("../services/emailService");
const Learner = require("../models/Learner");

class ResumeController {
  async createLearner(req, res, next) {
    try {
      const { name, course, portfolioUrl, feedbackEmail } = req.body;
      const email = req.user.email; // Use authenticated user's email

      if (!course) {
        return res.status(400).json({ error: "Course is required" });
      }

      // Set submittedBy from authenticated user
      const submittedBy = req.user.id;

      let resumeResult = null;
      let portfolioResult = null;
      let uploadResult = null;

      // Resume Evaluation if file present (skip Cloudinary upload)
      if (req.file) {
        const resumeData = await pdfParse(req.file.buffer);
        const resumeText = resumeData.text;

        if (!resumeText || resumeText.trim().length === 0) {
          throw new Error("Could not extract text from PDF.");
        }

        // Skipped upload to Cloudinary intentionally
        uploadResult = null;

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
            resumeFeedback: resumeResult.feedback,
            resumeScore: resumeResult.score,
          }),
          ...(portfolioResult && {
            portfolioUrl,
            portfolioFeedback: portfolioResult.feedback,
            portfolioScore: portfolioResult.score,
          }),
          ...(feedbackEmail && { feedbackEmail }),
        },
        { upsert: true, new: true }
      );

      // Send feedback email after evaluation
      try {
        console.log("Preparing to send feedback email...");

        // Prepare evaluation data for email
        const evaluationData = {
          name,
          email,
          course,
          ...(resumeResult && {
            resumeFeedback: resumeResult.feedback,
            resumeScore: resumeResult.score,
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

        // Use feedbackEmail if provided, otherwise use user's email
        const recipientEmail = feedbackEmail || email;

        // Send feedback email
        await emailService.sendFeedbackEmail(evaluationData, recipientEmail);
        console.log(`Feedback email sent to ${recipientEmail} for ${name}`);

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
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore createdAt emailSent emailSentAt submittedBy feedbackEmail"
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
          }),
          ...(portfolioResult && {
            portfolioFeedback: portfolioResult.feedback,
            portfolioScore: portfolioResult.score,
            portfolioUrl: portfolioUrl,
          }),
          emailSent: updatedLearner.emailSent,
          emailSentAt: updatedLearner.emailSentAt,
          createdAt: updatedLearner.createdAt,
          feedbackEmail: updatedLearner.feedbackEmail,
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
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore createdAt emailSent emailSentAt submittedBy"
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
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore createdAt emailSent emailSentAt submittedBy"
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
      const { name, course, feedbackEmail } = req.body;
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

      // Skip Cloudinary upload intentionally

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
        resumeFeedback: feedback,
        resumeScore: score,
        ...(feedbackEmail && { feedbackEmail }),
      });

      await learner.save();

      // Send feedback email after evaluation
      try {
        console.log("Preparing to send automatic resume feedback email...");

        const evaluationData = {
          name,
          email,
          course,
          resumeFeedback: feedback,
          resumeScore: score,
        };

        console.log("Resume evaluation data prepared:", {
          name: evaluationData.name,
          email: evaluationData.email,
          hasResumeFeedback: !!evaluationData.resumeFeedback,
        });

        // Use feedbackEmail if provided, otherwise use user's email
        const recipientEmail = feedbackEmail || email;

        // Send feedback email
        await emailService.sendFeedbackEmail(evaluationData, recipientEmail);
        console.log(
          `Resume feedback email sent to ${recipientEmail} for ${name}`
        );

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
          "_id name email course resumeFeedback resumeScore createdAt emailSent emailSentAt submittedBy feedbackEmail"
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
          emailSent: updatedLearner.emailSent,
          emailSentAt: updatedLearner.emailSentAt,
          createdAt: updatedLearner.createdAt,
          feedbackEmail: updatedLearner.feedbackEmail,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createPortfolioSubmission(req, res, next) {
    try {
      const { name, course, portfolioUrl, feedbackEmail } = req.body;
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
        ...(feedbackEmail && { feedbackEmail }),
      });

      await learner.save();

      // Send feedback email after evaluation
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

        // Use feedbackEmail if provided, otherwise use user's email
        const recipientEmail = feedbackEmail || email;

        // Send feedback email
        await emailService.sendFeedbackEmail(evaluationData, recipientEmail);
        console.log(
          `Portfolio feedback email sent to ${recipientEmail} for ${name}`
        );

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
          "_id name email course portfolioUrl portfolioFeedback portfolioScore createdAt emailSent emailSentAt submittedBy feedbackEmail"
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
          feedbackEmail: updatedLearner.feedbackEmail,
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

      // Use feedbackEmail from evaluation if available, otherwise use user's email
      const recipientEmail = evaluation.feedbackEmail || evaluation.email;

      // Send email using the emailService instance
      await emailService.sendFeedbackEmail(evaluation, recipientEmail);

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

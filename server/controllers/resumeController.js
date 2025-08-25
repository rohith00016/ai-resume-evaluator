const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const aiService = require("../services/aiService");
const Learner = require("../models/Learner");

class ResumeController {
  async uploadAndEvaluateSubmission(req, res, next) {
    try {
      const { name, email, course, portfolioUrl } = req.body;

      if (!email || !course) {
        return res.status(400).json({ error: "Email and course are required" });
      }

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
        { email, course },
        {
          $setOnInsert: { name },
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

      res.status(201).json({
        message: "Evaluation completed",
        learner: {
          _id: learner._id,
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
          createdAt: learner.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEvaluations(req, res, next) {
    try {
      // Get from database directly
      const learners = await Learner.find()
        .select(
          "_id name email course portfolioUrl portfolioFeedback portfolioScore resumeFeedback resumeScore resumeUrl createdAt emailSent emailSentAt"
        )
        .sort({ createdAt: -1 });

      res.json(learners);
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

      // Allow resending emails - remove this check to enable resend functionality

      // Send email
      const emailService = require("../services/emailService");
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
      next(error);
    }
  }
}

module.exports = new ResumeController();

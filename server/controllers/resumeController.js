const pdfParse = require("pdf-parse");
const cloudinary = require("../config/cloudinary");
const aiService = require("../services/aiService");
const Learner = require("../models/Learner");

class ResumeController {
  async uploadAndEvaluate(req, res, next) {
    try {
      const { name, email, prompt } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "Resume file is required" });
      }

      // Parse PDF content
      const resumeData = await pdfParse(req.file.buffer);
      const resumeText = resumeData.text;

      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error(
          "Could not extract text from PDF. Please ensure the PDF contains readable text."
        );
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

      // Get AI evaluation
      const { feedback, score } = await aiService.evaluateResume(
        resumeText,
        prompt
      );

      // Save to database
      const learner = new Learner({
        name,
        email,
        resumePublicId: uploadResult.public_id,
        resumeUrl: uploadResult.secure_url,
        feedback,
        score,
        prompt,
      });

      await learner.save();

      res.status(201).json({
        message: "Resume evaluated successfully",
        learner: {
          _id: learner._id,
          name: learner.name,
          email: learner.email,
          feedback: learner.feedback,
          score: learner.score,
          resumeUrl: learner.resumeUrl,
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
          "_id name email feedback score resumeUrl createdAt emailSent emailSentAt"
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

      // Check if email already sent
      if (evaluation.emailSent) {
        return res.status(400).json({
          error: "Email already sent for this evaluation",
          sentAt: evaluation.emailSentAt,
        });
      }

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

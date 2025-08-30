const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    // Validate environment variables
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.error("Email service configuration error:");
      console.error("MAIL_USER:", process.env.MAIL_USER ? "Set" : "Missing");
      console.error("MAIL_PASS:", process.env.MAIL_PASS ? "Set" : "Missing");
      throw new Error(
        "Email service configuration incomplete. Please check MAIL_USER and MAIL_PASS environment variables."
      );
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("Email transporter verification failed:", error);
      } else {
        console.log("Email service is ready to send emails");
      }
    });
  }

  async sendFeedbackEmail(evaluation, retryCount = 0) {
    if (!evaluation) {
      throw new Error("Evaluation object is required");
    }

    const {
      name,
      email,
      resumeFeedback,
      portfolioFeedback,
      resumeScore,
      portfolioScore,
      resumeUrl,
      portfolioUrl,
    } = evaluation;

    if (!name || !email) {
      throw new Error("Name and email are required for sending feedback");
    }

    // Determine which type of feedback to send
    const hasResumeFeedback = resumeFeedback && resumeFeedback.trim();
    const hasPortfolioFeedback = portfolioFeedback && portfolioFeedback.trim();

    let feedback, score, url, subject, evaluationType;

    if (hasResumeFeedback && hasPortfolioFeedback) {
      // Both resume and portfolio feedback available
      feedback = `RESUME FEEDBACK:\n${resumeFeedback}\n\nPORTFOLIO FEEDBACK:\n${portfolioFeedback}`;
      score = `Resume: ${resumeScore}/10, Portfolio: ${portfolioScore}/10`;
      url = resumeUrl || portfolioUrl;
      subject = `Resume & Portfolio Evaluation Feedback for ${name}`;
      evaluationType = "Resume & Portfolio";
    } else if (hasResumeFeedback) {
      // Only resume feedback
      feedback = resumeFeedback;
      score = `${resumeScore}/10`;
      url = resumeUrl;
      subject = `Resume Evaluation Feedback for ${name}`;
      evaluationType = "Resume";
    } else if (hasPortfolioFeedback) {
      // Only portfolio feedback
      feedback = portfolioFeedback;
      score = `${portfolioScore}/10`;
      url = portfolioUrl;
      subject = `Portfolio Evaluation Feedback for ${name}`;
      evaluationType = "Portfolio";
    } else {
      throw new Error("No feedback available to send");
    }

    console.log(
      `Sending ${evaluationType} feedback email to ${email} for ${name} (attempt ${
        retryCount + 1
      })`
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${evaluationType} Evaluation Feedback</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .score { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }
          .feedback { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .link { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${evaluationType} Evaluation Feedback</h2>
            <p>Hello ${name},</p>
            <p>Thank you for submitting your ${evaluationType.toLowerCase()} for evaluation. Here's your detailed feedback:</p>
          </div>
          
          <div class="score">
            Your ${evaluationType} Score: ${score}
          </div>
          
          <div class="feedback">
            <h3>Detailed Feedback:</h3>
            <p>${feedback.replace(/\n/g, "<br>")}</p>
          </div>
          
          ${
            url
              ? `
          <p><strong>Your ${evaluationType}:</strong></p>
          <a href="${url}" class="link" target="_blank">View ${evaluationType}</a>
          `
              : ""
          }
          
          <div class="footer">
            <p>This evaluation was generated using AI technology to provide objective feedback.</p>
            <p>If you have any questions, please don't hesitate to reach out.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      ${evaluationType} Evaluation Feedback for ${name}
      
      Your ${evaluationType} Score: ${score}
      
      Detailed Feedback:
      ${feedback}
      
      ${url ? `Your ${evaluationType}: ${url}` : ""}
      
      This evaluation was generated using AI technology to provide objective feedback.
    `;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Email send error:", error);

      // Retry logic for transient errors
      if (retryCount < 2) {
        console.log(
          `Retrying email send for ${email} (attempt ${retryCount + 2})`
        );
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.sendFeedbackEmail(evaluation, retryCount + 1);
      }

      throw new Error(
        `Failed to send email after ${retryCount + 1} attempts: ${
          error.message
        }`
      );
    }
  }

  async sendSubmissionConfirmation(evaluation, retryCount = 0) {
    if (!evaluation) {
      throw new Error("Evaluation object is required");
    }

    const { name, email, course } = evaluation;

    if (!name || !email) {
      throw new Error("Name and email are required for sending confirmation");
    }

    console.log(
      `Sending submission confirmation email to ${email} for ${name} (attempt ${
        retryCount + 1
      })`
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Submission Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Submission Confirmation</h2>
            <p>Hello ${name},</p>
            <p>Thank you for submitting your evaluation request!</p>
          </div>
          
          <div class="success">
            <h3>✅ Submission Received</h3>
            <p><strong>Course:</strong> ${course}</p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>We have successfully received your submission and our AI system is processing it. You will receive detailed feedback via email once the evaluation is complete.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our AI system will analyze your submission</li>
            <li>You'll receive comprehensive feedback and scoring</li>
            <li>The evaluation will be available in your dashboard</li>
          </ul>
          
          <div class="footer">
            <p>This is an automated confirmation. Please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Submission Confirmation for ${name}
      
      Thank you for submitting your evaluation request!
      
      ✅ Submission Received
      Course: ${course}
      Submission Date: ${new Date().toLocaleDateString()}
      
      We have successfully received your submission and our AI system is processing it. You will receive detailed feedback via email once the evaluation is complete.
      
      What happens next?
      - Our AI system will analyze your submission
      - You'll receive comprehensive feedback and scoring
      - The evaluation will be available in your dashboard
      
      This is an automated confirmation. Please do not reply to this email.
    `;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: `Submission Confirmation - ${course} Evaluation`,
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Confirmation email sent successfully:", result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Confirmation email send error:", error);

      // Retry logic for transient errors
      if (retryCount < 2) {
        console.log(
          `Retrying confirmation email send for ${email} (attempt ${
            retryCount + 2
          })`
        );
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.sendSubmissionConfirmation(evaluation, retryCount + 1);
      }

      throw new Error(
        `Failed to send confirmation email after ${retryCount + 1} attempts: ${
          error.message
        }`
      );
    }
  }
}

module.exports = new EmailService();

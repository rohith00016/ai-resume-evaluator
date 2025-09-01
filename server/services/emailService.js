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

  async sendFeedbackEmail(evaluation, feedbackEmail = null, retryCount = 0) {
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

    // Determine recipient email - use feedback email if provided, otherwise use user email
    const recipientEmail = feedbackEmail || email;
    const emailType = feedbackEmail ? "admin" : "user";

    console.log(
      `Sending ${evaluationType} feedback email to ${recipientEmail} (${emailType}) for ${name} (attempt ${
        retryCount + 1
      })`
    );

    // Build robust, responsive (email-safe) HTML using tables and inline styles
    const systemFont = "-apple-system, Segoe UI, Roboto, Arial, sans-serif";
    const primary = "#4F46E5";
    const border = "#E5E7EB";
    const bg = "#F5F6F8";

    const resumeScoreBlock = hasResumeFeedback
      ? `
            <tr>
              <td style="padding:14px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border}; border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font:600 14px ${systemFont}; color:#111827;">Resume Score</div>
                      <div style="margin:8px 0 10px; font:700 28px ${systemFont}; color:${primary}; line-height:1;">${resumeScore}/10</div>
                      <div style="height:8px; background:#EDF2F7; border-radius:6px; overflow:hidden;">
                        <div style="height:8px; width:${Math.max(
                          0,
                          Math.min(100, (Number(resumeScore) / 10) * 100)
                        )}%; background:${primary};"></div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
      : "";

    const portfolioScoreBlock = hasPortfolioFeedback
      ? `
            <tr>
              <td style="padding:4px 0 14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border}; border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font:600 14px ${systemFont}; color:#111827;">Portfolio Score</div>
                      <div style="margin:8px 0 10px; font:700 28px ${systemFont}; color:${primary}; line-height:1;">${portfolioScore}/10</div>
                      <div style="height:8px; background:#EDF2F7; border-radius:6px; overflow:hidden;">
                        <div style="height:8px; width:${Math.max(
                          0,
                          Math.min(100, (Number(portfolioScore) / 10) * 100)
                        )}%; background:${primary};"></div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
      : "";

    const linkBlock = url
      ? `
            <tr>
              <td style="padding-top:10px;">
                <a href="${url}" target="_blank" style="display:inline-block; background:${primary}; color:#ffffff; text-decoration:none; font:600 14px ${systemFont}; padding:12px 18px; border-radius:8px;">View ${evaluationType}</a>
              </td>
            </tr>`
      : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${evaluationType} Evaluation</title>
        </head>
        <body style="margin:0; padding:0; background:${bg};">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0;">Your ${evaluationType.toLowerCase()} feedback is ready</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
            <tr>
              <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; background:#ffffff; border-radius:16px; overflow:hidden;">
                  <tr>
                    <td style="background:${primary}; padding:20px 24px;">
                      <div style="font:700 18px ${systemFont}; color:#ffffff;">${evaluationType} Evaluation</div>
                      <div style="font:400 13px ${systemFont}; color:#E5E7EB; margin-top:6px;">Hello ${name}, here are your results</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        ${resumeScoreBlock}
                        ${portfolioScoreBlock}
                        <tr>
                          <td style="padding-top:6px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border}; border-radius:12px;">
                              <tr>
                                <td style="padding:16px 18px;">
                                  <div style="font:600 15px ${systemFont}; color:#111827; margin-bottom:6px;">Detailed Feedback</div>
                                  <div style="font:400 14px ${systemFont}; color:#374151; line-height:1.7;">${feedback.replace(
      /\n/g,
      "<br>"
    )}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${linkBlock}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid ${border}; background:#FAFAFB; padding:14px 24px;">
                      <div style="font:400 12px ${systemFont}; color:#6B7280;">This email was generated by AI to provide objective, actionable feedback.</div>
                      <div style="font:400 12px ${systemFont}; color:#9CA3AF; margin-top:4px;">© ${new Date().getFullYear()} AI Resume Evaluator</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

    const textContent = `
      ${evaluationType} Evaluation Results
      
      Hello ${name},
      
      Here's your detailed feedback for your ${evaluationType.toLowerCase()} evaluation:
      
      Overall Score: ${score}
      
      Detailed Analysis:
      ${feedback}
      
      ${url ? `View your ${evaluationType.toLowerCase()}: ${url}` : ""}
      
      This evaluation was generated using advanced AI technology to provide objective feedback.
      
      © ${new Date().getFullYear()} AI Resume Evaluator. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: recipientEmail,
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
          `Retrying email send for ${recipientEmail} (attempt ${
            retryCount + 2
          })`
        );
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.sendFeedbackEmail(
          evaluation,
          feedbackEmail,
          retryCount + 1
        );
      }

      throw new Error(
        `Failed to send email after ${retryCount + 1} attempts: ${
          error.message
        }`
      );
    }
  }
}

module.exports = new EmailService();

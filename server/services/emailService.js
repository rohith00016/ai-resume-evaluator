const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    // Validate environment variables
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_REGION ||
      !process.env.AWS_SES_FROM_EMAIL
    ) {
      logger.error("Email service configuration error", {
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "Set" : "Missing",
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
          ? "Set"
          : "Missing",
        AWS_REGION: process.env.AWS_REGION ? "Set" : "Missing",
        AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL ? "Set" : "Missing",
      });
      throw new Error(
        "Email service configuration incomplete. Please check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_SES_FROM_EMAIL environment variables."
      );
    }

    // Initialize AWS SES client
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.fromEmail = process.env.AWS_SES_FROM_EMAIL;
    logger.info("AWS SES email service initialized successfully");
  }

  /**
   * Formats feedback text into styled HTML for email
   */
  formatFeedbackForEmail(feedback) {
    if (!feedback) return "";

    // Clean up the text
    let cleaned = feedback
      .replace(/W\*W\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*([^*]+)\*/g, "$1")
      .trim();

    const lines = cleaned.split("\n").filter((line) => line.trim());
    const formattedLines = [];
    let inList = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (inList) {
          formattedLines.push("</ul>");
          inList = false;
        }
        formattedLines.push("<br>");
        return;
      }

      // Detect headers (lines ending with :)
      if (
        trimmed.endsWith(":") &&
        !trimmed.match(/^[•\-\*]\s/) &&
        !trimmed.match(/^\d+\./)
      ) {
        // Skip "Section-by-Section Scores" header
        const headerText = trimmed.slice(0, -1).toLowerCase();
        if (headerText.includes("section-by-section") || headerText.includes("section by section")) {
          return;
        }
        if (inList) {
          formattedLines.push("</ul>");
          inList = false;
        }
        formattedLines.push(
          `<div style="font:600 16px ${this.systemFont}; color:#111827; margin:20px 0 12px; padding-bottom:8px; border-bottom:2px solid #E5E7EB;">${trimmed.slice(0, -1)}</div>`
        );
        return;
      }

      // Detect bullet points
      if (trimmed.match(/^[•\-\*]\s/)) {
        const content = trimmed.replace(/^[•\-\*]\s/, "");
        // Skip section-by-section scores (bullet points with score pattern)
        const scoreMatch = content.match(/^(.+?):\s*(\d+)\/(\d+)$/);
        if (scoreMatch) {
          // Skip this line - it's a section-by-section score
          // Also check for common section names like Experience, Header, Skills, etc.
          const label = scoreMatch[1].toLowerCase();
          const sectionKeywords = ['experience', 'header', 'summary', 'skills', 'education', 'projects', 'achievements', 'certifications'];
          if (sectionKeywords.some(keyword => label.includes(keyword))) {
            return;
          }
          return;
        }
        if (!inList) {
          formattedLines.push(
            '<ul style="list-style:none; padding-left:0; margin:12px 0;">'
          );
          inList = true;
        }
        formattedLines.push(
          `<li style="margin:8px 0; padding-left:20px; position:relative; font:400 14px ${this.systemFont}; color:#374151; line-height:1.7;">
            <span style="position:absolute; left:0; color:#6B7280; font-weight:bold;">•</span>
            ${content}
          </li>`
        );
        return;
      }

      // Detect numbered lists
      if (trimmed.match(/^\d+\.\s/)) {
        if (!inList) {
          formattedLines.push(
            '<ul style="list-style:decimal; padding-left:24px; margin:12px 0;">'
          );
          inList = true;
        }
        const content = trimmed.replace(/^\d+\.\s/, "");
        formattedLines.push(
          `<li style="margin:6px 0; font:400 14px ${this.systemFont}; color:#374151; line-height:1.6;">${content}</li>`
        );
        return;
      }

      // Regular paragraph
      if (inList) {
        formattedLines.push("</ul>");
        inList = false;
      }

      // Check for inline score patterns (like "Overall Score: 8/10")
      const scoreMatch = trimmed.match(/^(.+?):\s*(\d+)\/(\d+)$/);
      if (scoreMatch) {
        const [, label, scoreStr, maxStr] = scoreMatch;
        const score = parseInt(scoreStr);
        const max = parseInt(maxStr);
        const labelLower = label.toLowerCase();
        
        // Only show overall score, skip section-by-section scores
        if (labelLower.includes("overall")) {
          // Determine color based on score (0-4: red, 5-7: yellow, 8-10: green)
          let scoreColor = '#374151'; // default gray
          if (score >= 8) {
            scoreColor = '#059669'; // green
          } else if (score >= 5) {
            scoreColor = '#D97706'; // yellow/amber
          } else {
            scoreColor = '#DC2626'; // red
          }
          
          formattedLines.push(
            `<p style="margin:16px 0; font:600 15px ${this.systemFont}; color:#111827; padding-bottom:8px; border-bottom:1px solid #E5E7EB;">
              <span style="color:#111827;">${label}:</span> <span style="color:${scoreColor}; font-weight:700;">${score}/${max}</span>
            </p>`
          );
        } else {
          // Skip other score patterns (section-by-section like Experience, Header, etc.)
          const sectionKeywords = ['experience', 'header', 'summary', 'skills', 'education', 'projects', 'achievements', 'certifications'];
          if (!sectionKeywords.some(keyword => labelLower.includes(keyword))) {
            // If it's not a known section, treat as regular paragraph
            formattedLines.push(
              `<p style="margin:12px 0; font:400 14px ${this.systemFont}; color:#374151; line-height:1.7;">${trimmed}</p>`
            );
          }
        }
      } else {
        formattedLines.push(
          `<p style="margin:12px 0; font:400 14px ${this.systemFont}; color:#374151; line-height:1.7;">${trimmed}</p>`
        );
      }
    });

    if (inList) {
      formattedLines.push("</ul>");
    }

    return formattedLines.join("");
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

    logger.info(`Sending ${evaluationType} feedback email`, {
      recipientEmail,
      emailType,
      name,
      attempt: retryCount + 1,
    });

    // Build robust, responsive (email-safe) HTML using tables and inline styles
    this.systemFont = "-apple-system, Segoe UI, Roboto, Arial, sans-serif";
    const border = "#E5E7EB";
    const bg = "#F9FAFB";

    const resumeScoreBlock = hasResumeFeedback
      ? `
            <tr>
              <td style="padding:14px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border}; border-radius:8px; background:#FFFFFF;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font:600 13px ${this.systemFont}; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Resume Score</div>
                      <div style="margin:0 0 12px; font:700 32px ${this.systemFont}; color:#111827; line-height:1;">${resumeScore}/10</div>
                      <div style="height:6px; background:#F3F4F6; border-radius:3px; overflow:hidden;">
                        <div style="height:6px; width:${Math.max(
                          0,
                          Math.min(100, (Number(resumeScore) / 10) * 100)
                        )}%; background:#111827;"></div>
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
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border}; border-radius:8px; background:#FFFFFF;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font:600 13px ${this.systemFont}; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Portfolio Score</div>
                      <div style="margin:0 0 12px; font:700 32px ${this.systemFont}; color:#111827; line-height:1;">${portfolioScore}/10</div>
                      <div style="height:6px; background:#F3F4F6; border-radius:3px; overflow:hidden;">
                        <div style="height:6px; width:${Math.max(
                          0,
                          Math.min(100, (Number(portfolioScore) / 10) * 100)
                        )}%; background:#111827;"></div>
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
              <td style="padding-top:12px;">
                <a href="${url}" target="_blank" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; font:600 14px ${this.systemFont}; padding:12px 20px; border-radius:6px;">View ${evaluationType}</a>
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
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid ${border};">
                  <tr>
                    <td style="background:#FFFFFF; padding:24px 24px 20px; border-bottom:1px solid ${border};">
                      <div style="font:700 20px ${this.systemFont}; color:#111827; margin-bottom:4px;">${evaluationType} Evaluation</div>
                      <div style="font:400 14px ${this.systemFont}; color:#6B7280;">Hello ${name}, here are your results</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        ${resumeScoreBlock}
                        ${portfolioScoreBlock}
                        <tr>
                          <td style="padding-top:20px;">
                            <div style="font:600 16px ${this.systemFont}; color:#111827; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid ${border};">Detailed Feedback</div>
                            <div style="font:400 14px ${this.systemFont}; color:#374151; line-height:1.7;">
                              ${this.formatFeedbackForEmail(feedback)}
                            </div>
                          </td>
                        </tr>
                        ${linkBlock}
                      </table>
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

    const emailParams = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: textContent,
            Charset: "UTF-8",
          },
          Html: {
            Data: htmlContent,
            Charset: "UTF-8",
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(emailParams);
      const result = await this.sesClient.send(command);
      logger.info("Email sent successfully", {
        messageId: result.MessageId,
        recipientEmail,
        name,
      });
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      logger.error("Email send error", {
        error: error.message,
        recipientEmail,
        name,
        attempt: retryCount + 1,
        stack: error.stack,
      });

      // Retry logic for transient errors
      if (retryCount < 2) {
        logger.info("Retrying email send", {
          recipientEmail,
          attempt: retryCount + 2,
        });
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

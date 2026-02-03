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

    const lines = cleaned.split("\n");
    const formattedLines = [];
    let inList = false;
    let listType = "ol"; // Track list type: "ol" for ordered, "ul" for unordered
    let consecutiveEmptyLines = 0;
    let lastListItemIndex = -1;
    let lastListItemContent = null; // Track if we need to close last list item

    // First pass: identify all list items to know when lists should continue
    const listItemIndices = new Set();
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-\*\u2022\u2023\u25E6]\s+/) || 
          trimmed.match(/^[•\-\*]\s/) || 
          trimmed.match(/^\d+\.\s/)) {
        listItemIndices.add(index);
      }
    });

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const isLastLine = index === lines.length - 1;
      
      // Check if there are more list items coming (look ahead up to 5 lines)
      const hasMoreListItems = Array.from({length: Math.min(5, lines.length - index - 1)}, (_, i) => index + i + 1)
        .some(i => listItemIndices.has(i));
      
      // Handle empty lines - allow one empty line within lists, but close on multiple
      if (!trimmed) {
        consecutiveEmptyLines++;
        // Only close list if multiple empty lines AND no more list items coming
        if (consecutiveEmptyLines > 2 && inList && !hasMoreListItems) {
          formattedLines.push(`</${listType}>`);
          inList = false;
        } else if (consecutiveEmptyLines <= 1) {
          formattedLines.push("<br>");
        }
        return;
      }
      
      consecutiveEmptyLines = 0; // Reset counter on non-empty line

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
        // Skip "Portfolio Analysis Summary" header (shown in different format)
        if (headerText.includes("portfolio analysis summary")) {
          return;
        }
        // Close list before header
        if (inList) {
          formattedLines.push(`</${listType}>`);
          inList = false;
        }
        formattedLines.push(
          `<div style="font-weight:600; font-size:15px; font-family:${this.systemFont}; color:#0F172A; margin-bottom:12px; text-align:left;">${trimmed.slice(0, -1)}</div>`
        );
        return;
      }

      // Detect bullet points - convert to numbered lists
      // Match various bullet formats: •, -, *, or Unicode bullets with optional spacing
      if (trimmed.match(/^[•\-\*\u2022\u2023\u25E6]\s+/) || trimmed.match(/^[•\-\*]\s/)) {
        const content = trimmed.replace(/^[•\-\*\u2022\u2023\u25E6]\s+/, "").replace(/^[•\-\*]\s/, "").trim();
        if (!content) return; // Skip empty bullet points
        
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
            '<ol style="list-style:decimal; padding-left:22px; margin:0;">'
          );
          inList = true;
          listType = "ol";
        }
        // Close previous list item if it had additional content
        if (lastListItemContent !== null) {
          formattedLines.push('</li>');
          lastListItemContent = null;
        }
        formattedLines.push(
          `<li style="margin:8px 0; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.9; text-align:left;">${content}</li>`
        );
        lastListItemIndex = index;
        return;
      }

      // Detect numbered lists
      if (trimmed.match(/^\d+\.\s/)) {
        if (!inList) {
          formattedLines.push(
            '<ol style="list-style:decimal; padding-left:22px; margin:0;">'
          );
          inList = true;
          listType = "ol";
        }
        const content = trimmed.replace(/^\d+\.\s/, "");
        formattedLines.push(
          `<li style="margin:8px 0; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.9; text-align:left;">${content}</li>`
        );
        return;
      }

      // Regular paragraph - if in list and more items coming, add to current list item
      // Otherwise, close list and add paragraph
      if (inList) {
        if (hasMoreListItems && lastListItemIndex >= 0) {
          // More list items coming - add paragraph content to the last list item
          formattedLines.push(
            `<p style="margin:8px 0 0; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.75; text-align:left;">${trimmed}</p>`
          );
          lastListItemContent = true;
        } else {
          // Close last list item if open, then close list and add paragraph
          if (lastListItemContent !== null) {
            formattedLines.push('</li>');
            lastListItemContent = null;
          }
          formattedLines.push(`</${listType}>`);
        inList = false;
          lastListItemIndex = -1;
          formattedLines.push(
            `<p style="margin:0 0 24px; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.75; text-align:left;">${trimmed}</p>`
          );
        }
      } else {
        // Not in list - just add paragraph
        // Check for inline score patterns (like "Overall Score: 8/10" or "Overall Score: 2.5/10")
        const scoreMatch = trimmed.match(/^(.+?):\s*([\d.]+)\/(\d+)$/);
      if (scoreMatch) {
          const [, label] = scoreMatch;
        const labelLower = label.toLowerCase();
        
          // Skip overall score display (shown in score box instead) - handle all variations
          if (labelLower.includes("overall") || labelLower.includes("score")) {
            return;
        } else {
          // Skip other score patterns (section-by-section like Experience, Header, etc.)
          const sectionKeywords = ['experience', 'header', 'summary', 'skills', 'education', 'projects', 'achievements', 'certifications'];
          if (!sectionKeywords.some(keyword => labelLower.includes(keyword))) {
            // If it's not a known section, treat as regular paragraph
            formattedLines.push(
                `<p style="margin:0 0 24px; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.75; text-align:left;">${trimmed}</p>`
            );
          }
        }
      } else {
        formattedLines.push(
            `<p style="margin:0 0 24px; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.75; text-align:left;">${trimmed}</p>`
        );
        }
      }
    });

    // Close any open list item and list
    if (lastListItemContent !== null) {
      formattedLines.push('</li>');
    }
    if (inList) {
      formattedLines.push(`</${listType}>`);
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

    // Build modern, responsive (email-safe) HTML using tables and inline styles
    this.systemFont = "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif";
    const border = "#E5E7EB";
    const bg = "#F3F4F6";
    const greenColor = "#22C55E";
    
    // Score colors for progress bar
    const getScoreColor = (score) => {
      const numScore = Number(score);
      if (numScore >= 8) return "#059669";
      if (numScore >= 5) return "#D97706";
      return "#DC2626";
    };

    // Score block - single score display (email-safe)
    const scoreBlock = hasResumeFeedback
      ? `
            <tr>
              <td style="padding:0 48px 40px; background:#FFFFFF;" align="center">
                <table role="presentation" width="360" cellpadding="0" cellspacing="0" style="border:1px solid ${greenColor}; background:#FFFFFF; max-width:360px;">
                  <tr>
                    <td style="padding:32px 28px; text-align:center;">
                      <div style="font-weight:500; font-size:9px; font-family:${this.systemFont}; color:#475569; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">Resume Score</div>
                      <div style="font-weight:700; font-size:48px; font-family:${this.systemFont}; color:#111827; line-height:1; margin-bottom:20px;">${resumeScore}<span style="font-weight:400; font-size:28px; color:#9CA3AF;">/10</span></div>
                      <table role="presentation" width="220" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="height:6px; background:#E5E7EB; padding:0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="height:6px; width:${Math.max(
                          0,
                          Math.min(100, (Number(resumeScore) / 10) * 100)
                                )}%; background:${greenColor}; padding:0;"></td>
                                <td style="height:6px; background:#E5E7EB; padding:0;"></td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
      : hasPortfolioFeedback
      ? `
            <tr>
              <td style="padding:0 48px 40px; background:#FFFFFF;" align="center">
                <table role="presentation" width="360" cellpadding="0" cellspacing="0" style="border:1px solid ${greenColor}; background:#FFFFFF; max-width:360px;">
                  <tr>
                    <td style="padding:32px 28px; text-align:center;">
                      <div style="font-weight:500; font-size:9px; font-family:${this.systemFont}; color:#475569; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">Portfolio Score</div>
                      <div style="font-weight:700; font-size:48px; font-family:${this.systemFont}; color:#111827; line-height:1; margin-bottom:20px;">${portfolioScore}<span style="font-weight:400; font-size:28px; color:#9CA3AF;">/10</span></div>
                      <table role="presentation" width="220" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="height:6px; background:#E5E7EB; padding:0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="height:6px; width:${Math.max(
                          0,
                          Math.min(100, (Number(portfolioScore) / 10) * 100)
                                )}%; background:${greenColor}; padding:0;"></td>
                                <td style="height:6px; background:#E5E7EB; padding:0;"></td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
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
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
            <tr>
              <td align="center" style="padding:60px 20px;">
                <table role="presentation" width="650" cellpadding="0" cellspacing="0" style="width:650px; max-width:650px; background:#FFFFFF; position:relative;">
                  <!-- Header -->
                  <tr>
                    <td style="padding:48px 48px 24px; text-align:center; background:#FFFFFF;">
                      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/guvi-logo-gLpzR6WIaPPfUZsIzGsPLsTKzkxgq2.png" alt="GUVI Logo" style="max-width:120px; height:auto; margin-bottom:24px; display:block; margin-left:auto; margin-right:auto;">
                      <div style="font-weight:400; font-size:15px; font-family:${this.systemFont}; color:#64748B; margin-bottom:8px;">Hello <span style="color:${greenColor};">${name}</span>,</div>
                      <div style="font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569;">Your ${evaluationType.toLowerCase()} has been evaluated</div>
                    </td>
                  </tr>
                  
                  <!-- Score Section -->
                  ${scoreBlock}
                  
                  <!-- Detailed Feedback Section -->
                  <tr>
                    <td style="padding:0 48px 48px; background:#FFFFFF; text-align:left;">
                      <div style="font-weight:700; font-size:18px; font-family:${this.systemFont}; color:#0F172A; margin-bottom:20px; text-align:left;">Detailed Feedback</div>
                      
                      <div style="font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#475569; line-height:1.75; text-align:left;">
                        ${this.formatFeedbackForEmail(feedback)}
                      </div>
                      
                      <!-- Notice Section - Direct content to prevent Gmail collapsing -->
                      <div style="margin-top:32px; padding-top:24px; border-top:1px solid ${border};">
                        <p style="margin:0 0 8px; font-weight:400; font-size:14px; font-family:${this.systemFont}; color:#111827; line-height:1.6; text-align:left;">
                          Kindly rework as per the above feedback and submit it for review in the same form within 2 days.
                        </p>
                        <p style="margin:0; font-weight:400; font-size:11px; font-family:${this.systemFont}; color:#94A3B8; line-height:1.4; text-align:left;">
                          This is an auto-generated email. Please do not reply.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

    const textContent = `
      Hello ${name},
      
      Your ${evaluationType.toLowerCase()} has been evaluated.
      
      Score: ${score}
      
      Detailed Feedback:
      ${feedback}
      
      Kindly rework as per the above feedback and submit it for review in the same form within 2 days.
      
      This is an auto-generated email. Please do not reply.
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

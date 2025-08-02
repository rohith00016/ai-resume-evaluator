const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendFeedbackEmail(evaluation) {
    const { name, email, feedback, score, resumeUrl } = evaluation;

    const subject = `Resume Evaluation Feedback for ${name}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Resume Evaluation Feedback</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .score { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }
          .feedback { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .resume-link { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Resume Evaluation Feedback</h2>
            <p>Hello ${name},</p>
            <p>Thank you for submitting your resume for evaluation. Here's your detailed feedback:</p>
          </div>
          
          <div class="score">
            Your Resume Score: ${score}/10
          </div>
          
          <div class="feedback">
            <h3>Detailed Feedback:</h3>
            <p>${feedback.replace(/\n/g, "<br>")}</p>
          </div>
          
          <p><strong>Your Resume:</strong></p>
          <a href="${resumeUrl}" class="resume-link" target="_blank">View Resume</a>
          
          <div class="footer">
            <p>This evaluation was generated using AI technology to provide objective feedback.</p>
            <p>If you have any questions, please don't hesitate to reach out.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Resume Evaluation Feedback for ${name}
      
      Your Resume Score: ${score}/10
      
      Detailed Feedback:
      ${feedback}
      
      Your Resume: ${resumeUrl}
      
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
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();

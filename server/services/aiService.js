const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async makeRequestWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent([prompt]);
        return result.response.text();
      } catch (error) {
        console.error(`AI API attempt ${attempt} failed:`, error.message);

        if (error.status === 429 && error.errorDetails) {
          const retryDelayInfo = error.errorDetails.find(
            (e) => e["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );
          const delayMs = retryDelayInfo
            ? parseInt(retryDelayInfo.retryDelay) * 1000
            : 30000 * attempt;

          console.log(
            `Quota exceeded, retrying after ${delayMs}ms (Attempt ${attempt}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else if (attempt === maxRetries) {
          throw new Error(
            `Max retries exceeded for AI API request: ${error.message}`
          );
        } else {
          // For other errors, wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
        }
      }
    }
    throw new Error("Max retries exceeded for AI API request");
  }

  extractScore(text) {
    const patterns = [
      /score\s*[:=\-]?\s*(\d+(\.\d+)?)/i,
      /(\d+(\.\d+)?)\s*\/\s*10/i,
      /(\d+(\.\d+)?)\s*out\s*of\s*10/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseFloat(match[1]);
        return score >= 0 && score <= 10 ? score : null;
      }
    }
    return null;
  }

  async evaluateResume(resumeText, prompt) {
    const aiPrompt = `${prompt}\n\nResume:\n${resumeText}\n\nProvide detailed feedback on the resume and include a score out of 10 in the format 'Score: X.X' (e.g., 'Score: 8.5'). The feedback should be comprehensive and actionable.`;

    const feedback = await this.makeRequestWithRetry(aiPrompt);
    const score = this.extractScore(feedback);

    return { feedback, score: score || 5.0 };
  }
}

module.exports = new AIService();

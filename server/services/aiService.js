const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Primary model (can be configured via env, default to flash-lite)
    this.primaryModelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    // Fallback models to try if primary model quota is exceeded
    this.fallbackModels = [
      "gemini-2.5-flash-lite",
    ];
    this.currentModelName = this.primaryModelName;
    this.model = this.genAI.getGenerativeModel({ model: this.currentModelName });
    this.quotaExceededModels = new Set(); // Track models that have exceeded quota
  }

  switchToFallbackModel() {
    const availableModel = this.fallbackModels.find(
      (model) => !this.quotaExceededModels.has(model)
    );

    if (availableModel) {
      this.currentModelName = availableModel;
      this.model = this.genAI.getGenerativeModel({ model: this.currentModelName });
      console.log(`[AIService] Switched to fallback model: ${this.currentModelName}`);
      return true;
    }

    return false;
  }

  async makeRequestWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent([prompt]);
        return result.response.text();
      } catch (error) {
        console.error(`[AIService] API attempt ${attempt} failed (model: ${this.currentModelName}):`, error.message);

        const isQuotaError =
          error.status === 429 ||
          error.message?.toLowerCase().includes("quota") ||
          error.message?.toLowerCase().includes("429");

        if (isQuotaError) {
          // Mark current model as quota exceeded
          this.quotaExceededModels.add(this.currentModelName);
          console.log(`[AIService] Quota exceeded for model: ${this.currentModelName}`);

          if (this.switchToFallbackModel()) {
            console.log(`[AIService] Retrying with fallback model: ${this.currentModelName}`);
            attempt--; // Retry with new model without counting as failed attempt
            continue;
          }

          // No more fallback models available
          const retryDelayInfo = error.errorDetails?.find(
            (e) => e["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          );
          const delayMs = retryDelayInfo
            ? parseInt(retryDelayInfo.retryDelay) * 1000
            : 30000 * attempt;

          console.log(
            `[AIService] All models quota exceeded, retrying after ${delayMs}ms (Attempt ${attempt}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else if (attempt === maxRetries) {
          throw new Error(
            `Max retries exceeded for AI API request: ${error.message}`
          );
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
        }
      }
    }
  }

  extractScore(text) {
    const patterns = [
      /overall\s*score\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*\/\s*10/i, // "Overall Score: X/10"
      /overall\s*score\s*[:=\-]?\s*(\d+(?:\.\d+)?)(?!\s*\/)/i, // "Overall Score: X" (without /10)
      /(\d+(?:\.\d+)?)\s*\/\s*10/i, // Any "X/10" pattern
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseFloat(match[1]);
        if (score >= 0 && score <= 10) {
          return score;
        }
      }
    }

    return null;
  }

  getCourseEvaluationCriteria(course) {
    const baseInstructions = `
You are an AI resume evaluator specializing in technical roles. Your task is to evaluate resumes against specific criteria and provide constructive feedback with scoring.

CRITICAL FIRST STEP - DOCUMENT TYPE VALIDATION:
Before evaluating, you MUST first determine if the submitted content is actually a RESUME/CV document:
- A resume is a document intended for job applications that contains information about a candidate
- MINIMUM REQUIREMENTS to be considered a resume: The document must have at least 2 of the following:
  * Candidate's name (or identifier)
  * Contact information (email, phone, or links)
  * Skills section OR technical skills mentioned
  * Work experience OR projects OR education
  * Any structured information about the candidate's background
- IMPORTANT: Be LENIENT in validation - if the document appears to be an attempt at a resume (even if poorly formatted or incomplete), treat it as a resume and provide evaluation feedback
- Only reject if the content is clearly NOT a resume (e.g., it's a portfolio website HTML, a project repository README, a cover letter, random unrelated text, a blog post, or completely unrelated content)
- If the submitted content is clearly NOT a resume, you MUST:
  1. Give it an Overall Score of 0/10 (format it EXACTLY as "Overall Score: 0/10" at the beginning of your response)
  2. Clearly state in the feedback that this is not a resume
  3. Explain what type of document it appears to be instead
  4. Provide guidance on what a resume should contain
  5. Skip all other evaluation sections - DO NOT provide section-by-section scores, Strengths, Areas for Improvement, Missing Elements, or Recommendations
  6. Your response should ONLY contain: "Overall Score: 0/10" followed by the explanation

Only proceed with full evaluation if the content is confirmed to be a resume/CV document OR if it appears to be an attempt at creating a resume (even if incomplete or poorly formatted).

GENERAL RULES:
- Examples are Reference Only: All mentioned tools, platforms, and examples serve as guidance - they are NOT mandatory requirements
- Fresher-Friendly: Candidates without experience can skip experience sections, but must demonstrate strong project portfolios
- Scoring Scale: Use 1-10 scale for each section (1=Poor, 5=Average, 8=Good, 10=Excellent)
- Constructive Feedback: Always provide specific, actionable improvement suggestions
- Internal Scoring: Calculate section-by-section scores (Header, Summary, Skills, Projects, Experience, Education) internally to determine the Overall Score, but DO NOT include these section scores in your response output - only show the Overall Score

CRITICAL EVALUATION APPROACH:
- FIRST, identify what elements ARE ALREADY PRESENT in the resume before suggesting additions
- ACKNOWLEDGE existing sections: If the resume already has a name, contact info, skills section, projects, education, etc., acknowledge these in your evaluation
- DO NOT suggest adding elements that already exist - instead, suggest improvements to existing elements (e.g., "enhance your existing summary" instead of "add a summary")
- Only list items in "Missing Elements" if they are truly absent from the resume
- In "Areas for Improvement" and "Recommendations", focus on enhancing existing content rather than adding what's already there
- Remember: PDF text extraction may lose formatting, but the content is still present - carefully analyze the text to identify all existing sections

EVALUATION OUTPUT FORMAT:
Provide your evaluation in this exact format:

Overall Score: X/10
Role Alignment: [How well the resume matches the target role]

Strengths:
1. First strength point
2. Second strength point
3. Third strength point (if applicable)

Areas for Improvement:
1. First improvement area (focus on enhancing existing content, not adding what's already there)
2. Second improvement area
3. Third improvement area
4. Fourth improvement area (if applicable)
5. Fifth improvement area (if applicable)

Missing Elements:
1. First missing element (ONLY list elements that are truly absent - carefully check the resume text before listing)
2. Second missing element (if applicable)
3. Continue listing critical missing items (if any - leave blank if all essential elements are present)

Recommendations:
1. First recommendation with clear next steps (acknowledge existing elements and suggest improvements, not additions of what already exists)
2. Second recommendation
3. Third recommendation
4. Continue with additional recommendations as needed

IMPORTANT FORMATTING RULES:
- Use numbered lists (1., 2., 3., etc.) for all list sections, NOT bullet points
- Do NOT add paragraphs between numbered list items - keep list items consecutive
- If you need to add explanatory text, include it within the list item itself or as a note after the list
- Keep each section's list items together without breaking them with paragraphs

WHAT TO LOOK FOR:
- Clarity and Organization: Information is easy to find and read
- Relevance: Content matches the target role
- Specificity: Concrete examples rather than generic statements
- Professional Presentation: Consistent formatting and professional language
- Technical Depth: Appropriate level of technical detail for the role
- Links and Contact: All provided links should be properly formatted and clickable
  * IMPORTANT: Text labels like "Email," "GitHub," "LinkedIn," "Portfolio," "Live Demo," and "Source Code" are perfectly acceptable and often preferred for better UX
  * Do NOT require explicit URLs in the text - clickable labels are sufficient
  * Only flag links if they are broken or non-functional
- Education Section: Must be present with basic degree and institution information

WHAT TO FLAG:
- Generic Content: Copy-paste summaries or skills lists
- Missing Critical Sections: No projects for freshers, no contact info, no education section
- Irrelevant Information: Skills or experience unrelated to the target role
- Poor Formatting: Inconsistent style, hard to read layout
- Broken or Missing Links: Non-functional portfolio or GitHub links
- Note: Text labels for links (e.g., "Email," "GitHub," "LinkedIn") are perfectly acceptable as long as they are clickable - do not penalize for using labels instead of explicit URLs
- Overly Long Descriptions: Verbose project or experience descriptions
`;

    switch (course) {
      case "UXUI":
        return `${baseInstructions}

🔷 UI/UX DESIGNER EVALUATION CRITERIA:

Required Sections & Scoring Criteria:

Header Section (Weight: 15%)
- Name and role clearly stated ("UI/UX Designer" or similar)
- Complete contact information (email, phone)
- Professional links (LinkedIn, portfolio) present and properly formatted
- All links should be clickable/valid format
- Note: Text labels like "Email," "GitHub," "LinkedIn," "Portfolio" are acceptable as long as they are clickable links - explicit URLs in text are not required

Summary/Objective (Weight: 10%)
- Minimum 2 lines of personalized content
- Clear career direction or design philosophy
- Specific to UI/UX field

Skills Section (Weight: 20%)
- UX Skills: User research, wireframing, prototyping, user journey mapping, usability testing
- Design Tools: Figma, Adobe XD, Sketch, Canva, Adobe Creative Suite, InVision
- Soft Skills: Creativity, collaboration, communication, empathy, critical thinking
- Skills should be relevant and appropriately categorized

Projects Section (Weight: 35%)
- Maximum 3 strong projects (quality over quantity)
- Each project should include:
  * Clear description of design goals and user problems solved
  * Tools and methodologies used
  * Design process or strategy mentioned
  * Measurable outcomes or impact (when possible)
  * Clickable links to case studies, prototypes, or mockups

Education (Weight: 10%)
- Education section must be present
- Basic degree and institution information is sufficient

Certifications (Weight: 5%)
- Course name, platform (Coursera, Udemy, Google, etc.), completion year
- Relevant to design field

Portfolio (Weight: 5%)
- Must include clickable portfolio link
- Personal website preferred over generic platforms
- Behance or Dribbble profiles are additional advantages`;

      case "MERN":
        return `${baseInstructions}

      🔷 MERN STACK DEVELOPER EVALUATION CRITERIA:

      Required Sections & Scoring Criteria:

      Header Section (Weight: 15%)
      - Name and role ("Full Stack Developer", "MERN Developer", etc.)
      - Complete contact information
      - LinkedIn and GitHub links present and properly formatted
      - All links should be clickable/valid
      - Note: Text labels like "Email," "GitHub," "LinkedIn," "Portfolio," "Live Demo," and "Source Code" are acceptable as long as they are clickable links - explicit URLs in text are not required

      Summary/Objective (Weight: 10%)
      - 2-3 lines maximum, focused and specific
      - Highlights interest in web/application development
      - Mentions MERN stack or full-stack development

      Skills Section (Weight: 20%)
      - Core MERN Stack: MongoDB, Express.js, React.js, Node.js
      - Additional Technical Skills: Git, REST APIs, JWT, Postman, HTML/CSS, JavaScript ES6+
      - Soft Skills: Problem-solving, debugging, collaboration, continuous learning
      - Skills should be organized by category (Frontend, Backend, Database, Tools)

      Projects Section (Weight: 35%)
      - Maximum 3 strong projects
      - Each project requires:
        * 2-3 line clear description
        * Technologies and tools used explicitly mentioned
        * Developer's specific role and contributions
        * GitHub repository links (must be clickable)
        * Live demo links when available
        * Focus on functionality and technical implementation

      Experience Section (Weight: 10%)
      - Use bullet points for readability
      - Describe specific roles and technical contributions
      - Mention technologies used in each role
      - Quantify achievements when possible
      - Example format: "Built user authentication system using JWT and bcrypt"

      Education (Weight: 5%)
        - Education section must be present
        - Basic degree and institution information is sufficient

      Certifications (Weight: 3%)
      - Course name, platform, completion year
      - Focus on relevant programming/web development certifications

      GitHub Profile (Weight: 2%)
      - Clickable GitHub link
      - Profile should show active contributions and repositories
      - README files and project documentation are advantages`;

      case "Devops":
        return `${baseInstructions}

🔷 DEVOPS ENGINEER EVALUATION CRITERIA:

Required Sections & Scoring Criteria:

Header Section (Weight: 15%)
- Name and role clearly stated
- Complete contact information
- LinkedIn and GitHub links properly formatted
- All links must be clickable
- Note: Text labels like "Email," "GitHub," "LinkedIn," "Portfolio," "Live Demo," and "Source Code" are acceptable as long as they are clickable links - explicit URLs in text are not required

Summary/Objective (Weight: 10%)
- Brief, role-specific summary
- Focus on automation, cloud technologies, or deployment
- Shows understanding of DevOps principles

Skills Section (Weight: 25%)
- Core DevOps Tools: Git, CI/CD (Jenkins, GitHub Actions, GitLab CI), Docker, Kubernetes
- Operating Systems: Linux, Windows Server
- Scripting: Bash, Python, PowerShell
- Cloud Platforms: AWS, Azure, GCP (beginner level acceptable)
- Monitoring: Prometheus, Grafana, ELK Stack
- Infrastructure as Code: Terraform, Ansible, CloudFormation
- Soft Skills: Analytical thinking, troubleshooting, documentation, automation mindset

Projects Section (Weight: 30%)
- Maximum 3 projects demonstrating DevOps practices
- Each project should describe:
  * DevOps implementation (CI/CD pipeline, containerization, deployment)
  * Tools and technologies used
  * Infrastructure setup or automation achieved
  * 2-3 line concise description
  * GitHub links or deployment URLs when public

Experience Section (Weight: 10%)
- Bullet point format
- Specific tools and platforms used
- Quantifiable contributions and outcomes
- Focus on automation, deployment, and infrastructure work

Education (Weight: 5%)
- Education section must be present
- Basic degree and institution information is sufficient

Certifications (Weight: 5%)
- Relevant certifications (AWS, Azure, Docker, Kubernetes)
- Platform name (AWS Academy, Coursera, Udemy, official vendor)
- Completion year only`;

      default:
        return `${baseInstructions}

Evaluate this resume comprehensively for technical competency and presentation quality using the general guidelines above.`;
    }
  }

  async evaluateResume(resumeText, course) {
    const evaluationCriteria = this.getCourseEvaluationCriteria(course);
    const aiPrompt = `${evaluationCriteria}

RESUME TO EVALUATE:
${resumeText}

Please evaluate this resume following the exact format specified above. Make sure to include:
1. Overall Score out of 10 (calculate this based on section-by-section evaluation internally, but DO NOT display section scores in your response)
2. Strengths (2-3 points) - acknowledge what's already good
3. Areas for improvement (3-5 actionable suggestions) - focus on enhancing existing content, not adding what's already there
4. Missing elements - ONLY list items that are truly absent from the resume
5. Specific recommendations - acknowledge existing elements and suggest improvements rather than additions

CRITICAL: DO NOT include "Section-by-Section Scores" or any section score breakdown in your response. Calculate these scores internally to determine the Overall Score, but only display the Overall Score in your output. The section scores are for internal calculation only and should not appear in the feedback.

IMPORTANT: Before suggesting any additions, carefully analyze the resume text to identify what elements ARE ALREADY PRESENT. PDF text extraction may lose formatting, but the content is still there. Do not suggest adding elements that already exist (e.g., if name and contact info are present, don't suggest adding them - instead suggest improvements to their presentation).

Focus on helping the candidate improve their resume for better job market success while maintaining realistic expectations for their experience level.`;

    const feedback = await this.makeRequestWithRetry(aiPrompt);
    const score = this.extractScore(feedback);
    return { feedback, score: score ?? 5.0 };
  }

  async evaluatePortfolio(portfolioUrl, course) {
    const evaluationCriteria = this.getCourseEvaluationCriteria(course);
    let scrapedContent = "No content scraped.";

    try {
      const scrapeWebsite = require("./scraperService");
      const scrapeResult = await scrapeWebsite(portfolioUrl);
      
      if (scrapeResult.success && scrapeResult.scrapedData.length > 0) {
        scrapedContent = scrapeResult.scrapedData
          .map((page) => {
            const texts = page.content.visibleTexts
              .map((item) => `${item.tag}: ${item.text}`)
              .join("\n");
            const links = page.content.links
              .map(
                (link) =>
                  `Link: ${link.text} (${link.href}) [Target: ${
                    link.target || "none"
                  }]`
              )
              .join("\n");
            const images = page.content.images
              .map((img) => `Image: ${img.src} (Alt: ${img.alt})`)
              .join("\n");
            return `Page: ${page.page}\n\nVisible Texts:\n${texts}\n\nLinks:\n${links}\n\nImages:\n${images}`;
          })
          .join("\n\n---\n\n");
      } else {
        // Scraping attempted but no content found
        console.warn(
          `⚠️ Scraping returned no content for ${portfolioUrl}. Pages attempted: ${scrapeResult.totalPages}`
        );
        scrapedContent = `Scraping attempted but no meaningful content was extracted from the website. The website may be using advanced bot protection, require authentication, or have content that loads in a way that cannot be scraped automatically. Portfolio URL: ${portfolioUrl}`;
      }
    } catch (error) {
      console.error(
        `❌ Failed to scrape portfolio: ${portfolioUrl} — ${error.message}`,
        error.stack
      );
      scrapedContent = `Unable to scrape content from ${portfolioUrl} due to: ${error.message}. Please verify the URL is accessible and try again.`;
    }

    const aiPrompt = `
${evaluationCriteria}

You are an AI portfolio evaluator. Evaluate the following portfolio website submitted by a ${course} student based on the comprehensive portfolio evaluation criteria.

CRITICAL FIRST STEP - DOCUMENT TYPE VALIDATION:
Before evaluating, you MUST first determine if the submitted content is actually a PORTFOLIO WEBSITE:
- A portfolio website should be: a personal/professional website showcasing the developer's work, projects, skills, and contact information
- It should contain: developer's name, projects with descriptions, skills section, contact information, links to GitHub/LinkedIn, and be a functional website
- If the submitted content is NOT a portfolio website (e.g., it's a resume document, a project repository readme, a blog post, a company website, random text, or any other type of content), you MUST:
  1. Give it an Overall Score of 0/10 (format it EXACTLY as "Overall Score: 0/10" at the beginning of your response)
  2. Clearly state in the feedback that this is not a portfolio website
  3. Explain what type of content it appears to be instead
  4. Provide guidance on what a portfolio website should contain
  5. Skip all other evaluation sections - DO NOT provide Portfolio Analysis Summary, Strengths, Areas for Improvement, Missing Elements, or Recommendations
  6. Your response should ONLY contain: "Overall Score: 0/10" followed by the explanation

Only proceed with full evaluation if the content is confirmed to be a portfolio website.

PORTFOLIO URL:
${portfolioUrl}

SCRAPED CONTENT:
${scrapedContent}

IMPORTANT: You are receiving raw scraped data. You need to analyze this data yourself to:

1. **Navigation Analysis**: Look for navigation sections, routes, and structure
2. **Skills Detection**: Identify technical skills mentioned in the content
3. **Project Analysis**: Find project sections, GitHub links, demo links
4. **Social Profiles**: Detect LinkedIn, GitHub, and other social links
5. **Resume Detection**: Look for resume/CV links and document downloads
6. **Technical Features**: Identify responsive design, performance, SEO mentions
7. **Link Behavior**: Check which links have target="_blank" and categorize as external vs internal

LINK ANALYSIS GUIDANCE:
- Look at the [Target: value] for each link in the scraped content
- Links with [Target: _blank] are correctly configured for external links
- Links with [Target: none] or missing target attribute need analysis:
  * EXTERNAL links (different domain) MUST have target="_blank"
  * INTERNAL links (same domain navigation) can open in same tab
- External links include: GitHub, LinkedIn, deployed projects, PDFs, any different domain
- Internal links include: About, Contact, Home, Projects sections within the same portfolio

PORTFOLIO EVALUATION CRITERIA:

1. NAVIGATION AND USER EXPERIENCE (25 points):
- External links (different domains) must open in new tabs/pages (target="_blank")
- Internal navigation links can open in same tab for better UX
- Responsive design across different screen sizes
- Clean and professional UI/UX
- Fast loading times
- Intuitive navigation structure

2. RESUME SECTION (15 points):
- Resume link must be present and functional
- Resume should open in new tab
- Option to download resume (PDF format preferred)
- Resume should be up-to-date and professional

3. SKILLS SECTION (20 points):
- Dedicated skills section must be visible
- Clear categorization of technical skills
- Include both frontend and backend technologies
- Mention of MERN stack components (MongoDB, Express.js, React.js, Node.js) for MERN students
- Additional relevant technologies and tools

4. PROJECTS SECTION (25 points):
- Minimum 3 projects must be displayed
- Each project must include:
  * Project description (clear and detailed explanation)
  * Tech stack used (technologies and frameworks)
  * GitHub links (separate for frontend and backend if applicable)
  * Deployed links (separate for frontend and backend if full-stack)
- Projects should demonstrate progression in complexity
- Variety in project types and technologies

5. SOCIAL PROFILE LINKS (15 points):
- LinkedIn profile link (must open in new tab)
- Gmail/Email contact (clickable mailto link or contact form)
- GitHub profile link (must open in new tab)
- All social links should be easily accessible

BONUS FEATURES (Extra Credit - up to 5 points):
- Dark/Light mode toggle
- Smooth animations and transitions
- SEO optimization
- Contact form functionality
- Blog or articles section
- Testimonials or recommendations
- Certificates and achievements display
- Analytics integration

TECHNICAL EXCELLENCE:
- Clean, semantic HTML structure
- Optimized images and assets
- Cross-browser compatibility
- Accessibility standards compliance
- Performance optimization
- Security best practices

CONTENT QUALITY:
- Professional photography/images
- Well-written project descriptions
- Clear and concise copy
- Regular updates and maintenance
- Personal branding consistency

RED FLAGS (Deductions):
- Broken links or non-functional features
- Poor mobile responsiveness
- Extremely slow loading times
- Unprofessional content or presentation
- Missing critical information
- External links that don't open in new tabs
- Placeholder or dummy content
- Copyright violations or plagiarized content

EVALUATION FORMAT:
Overall Score: X/10

Portfolio Analysis Summary:
- Navigation Structure: [Describe what you found - routes, sections, etc.]
- Skills Identified: [List technical skills found in content]
- Projects Found: [Describe project sections, GitHub links, demo links]
- Social Profiles: [List social platforms and link behavior]
- Resume/CV: [Describe resume links and document types]
- Technical Features: [List responsive design, performance, SEO mentions]
- Link Behavior: [Summary of external vs internal links and target="_blank" usage]

Strengths:
1. First strength point
2. Second strength point
3. Third strength point (if applicable)

Areas for Improvement:
1. First improvement area
2. Second improvement area
3. Third improvement area
4. Fourth improvement area (if applicable)
5. Fifth improvement area (if applicable)
Note: If external links are missing target="_blank", specifically mention which types of links need this attribute. Internal navigation links can open in same tab.

Missing Elements:
1. First missing element
2. Second missing element
3. Continue listing critical missing items

Recommendations:
1. First recommendation with clear next steps
2. Second recommendation
3. Third recommendation
4. Continue with additional recommendations as needed
Note: For external link improvements, specify exactly which links need target="_blank" (e.g., "Update footer GitHub and LinkedIn links to use target='_blank'"). Internal navigation links are fine to open in same tab.

IMPORTANT FORMATTING RULES:
- Use numbered lists (1., 2., 3., etc.) for all list sections, NOT bullet points
- Do NOT add paragraphs between numbered list items - keep list items consecutive
- If you need to add explanatory text, include it within the list item itself or as a note after the list
- Keep each section's list items together without breaking them with paragraphs

Please evaluate thoroughly against these specific criteria and return only the formatted feedback.
`;

    const feedback = await this.makeRequestWithRetry(aiPrompt);
    const score = this.extractScore(feedback);
    return { feedback, score: score ?? 5.0 };
  }
}

module.exports = new AIService();

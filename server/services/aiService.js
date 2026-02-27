const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
      /overall\s*score\s*[:=\-]?\s*(\d+(\.\d+)?)/i,
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

  getCourseEvaluationCriteria(course) {
    const baseInstructions = `
You are an AI resume evaluator specializing in technical roles. Your task is to evaluate resumes against specific criteria and provide constructive feedback with scoring.

GENERAL RULES:
- Examples are Reference Only: All mentioned tools, platforms, and examples serve as guidance - they are NOT mandatory requirements
- Fresher-Friendly: Candidates without experience can skip experience sections, but must demonstrate strong project portfolios
- Scoring Scale: Use 1-10 scale for each section (1=Poor, 5=Average, 8=Good, 10=Excellent)
- Constructive Feedback: Always provide specific, actionable improvement suggestions

EVALUATION OUTPUT FORMAT:
Provide your evaluation in this exact format:

Overall Score: X/10
Role Alignment: [How well the resume matches the target role]

Section-by-Section Scores:
- Header: X/10
- Summary: X/10
- Skills: X/15
- Projects: X/20
- Experience: X/10 (if applicable)
- Education: X/5

Strengths: [2-3 specific positive points]
Areas for Improvement: [3-5 actionable suggestions]
Missing Elements: [Critical components not present]
Recommendations: [Specific next steps for improvement]

WHAT TO LOOK FOR:
- Clarity and Organization: Information is easy to find and read
- Relevance: Content matches the target role
- Specificity: Concrete examples rather than generic statements
- Professional Presentation: Consistent formatting and professional language
- Technical Depth: Appropriate level of technical detail for the role
- Links and Contact: All provided links should be properly formatted
- Education Section: Must be present with basic degree and institution information

WHAT TO FLAG:
- Generic Content: Copy-paste summaries or skills lists
- Missing Critical Sections: No projects for freshers, no contact info, no education section
- Irrelevant Information: Skills or experience unrelated to the target role
- Poor Formatting: Inconsistent style, hard to read layout
- Broken or Missing Links: Non-functional portfolio or GitHub links
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
1. Overall Score out of 10
2. Section-by-section scores
3. Strengths (2-3 points)
4. Areas for improvement (3-5 actionable suggestions)
5. Missing elements
6. Specific recommendations

Focus on helping the candidate improve their resume for better job market success while maintaining realistic expectations for their experience level.`;

    const feedback = await this.makeRequestWithRetry(aiPrompt);
    const score = this.extractScore(feedback);

    return { feedback, score: score || 5.0 };
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
      }
    } catch (error) {
      console.warn(
        `Failed to scrape portfolio: ${portfolioUrl} — ${error.message}`
      );
      scrapedContent = `Unable to scrape content due to: ${error.message}`;
    }

    // Log scraped content for debugging
    console.log(`\n📋 Scraped Content for ${portfolioUrl}:`);
    console.log(`Content Length: ${scrapedContent.length} characters`);
    console.log(`Content Preview (first 500 chars): ${scrapedContent.substring(0, 500)}`);
    if (scrapedContent.length > 500) {
      console.log(`... (truncated, total ${scrapedContent.length} chars)`);
    }
    console.log(`Full Scraped Content:\n${scrapedContent}\n`);

    // Check if scraping failed - return error feedback instead of calling AI
    if (
      scrapedContent === "No content scraped." ||
      scrapedContent.startsWith("Unable to scrape content")
    ) {
      return {
        feedback: `⚠️ Unable to evaluate portfolio: The website at ${portfolioUrl} could not be scraped. This may be due to:\n\n- Website requires authentication or login\n- Anti-scraping protection (Cloudflare, etc.)\n- Website is down or inaccessible\n- Network connectivity issues\n- Frame detachment or navigation errors\n\nPlease verify the URL is accessible and try again, or contact support if the issue persists.`,
        score: 0,
        scrapingFailed: true,
      };
    }

    const aiPrompt = `
${evaluationCriteria}

You are an AI portfolio evaluator. Evaluate the following portfolio website submitted by a ${course} student based on the comprehensive portfolio evaluation criteria.

PORTFOLIO URL:
${portfolioUrl}

SCRAPED CONTENT:
${scrapedContent}

CRITICAL ANTI-HALLUCINATION RULES:
- ONLY evaluate based on the actual scraped content provided above
- DO NOT make up, guess, infer, or hallucinate any information
- DO NOT create project names, skills, or details that are not explicitly in the scraped content
- DO NOT infer information from the URL alone - only use what's in the scraped content
- If a project name is not in the scraped content, DO NOT mention it
- If a skill is not explicitly listed in the scraped content, DO NOT include it
- If scraped content is minimal or missing, state that evaluation cannot be completed accurately
- ONLY mention what is explicitly present in the scraped content text, links, and images
- When listing projects, ONLY list projects that are explicitly mentioned in the scraped content
- When listing skills, ONLY list skills that are explicitly mentioned in the scraped content

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

PORTFOLIO ANALYSIS SUMMARY:
- Navigation Structure: [Describe what you found - routes, sections, etc.]
- Skills Identified: [List technical skills found in content]
- Projects Found: [Describe project sections, GitHub links, demo links]
- Social Profiles: [List social platforms and link behavior]
- Resume/CV: [Describe resume links and document types]
- Technical Features: [List responsive design, performance, SEO mentions]
- Link Behavior: [Summary of external vs internal links and target="_blank" usage]

Strengths:
- Bullet points listing 2-3 strong areas based on the criteria above

Areas for Improvement:
- Bullet points with 3–5 specific improvement suggestions based on missing criteria
- If external links are missing target="_blank", specifically mention which types of links need this attribute
- Note: Internal navigation links can open in same tab

Missing Elements:
- List anything critical that’s missing (e.g., no contact form, no project explanations)

Recommendations:
- Bullet points with clear next steps to improve this portfolio based on the evaluation criteria
- For external link improvements, specify exactly which links need target="_blank" (e.g., "Update footer GitHub and LinkedIn links to use target='_blank'")
- Internal navigation links are fine to open in same tab

Please evaluate thoroughly against these specific criteria and return only the formatted feedback.
`;

    const feedback = await this.makeRequestWithRetry(aiPrompt);
    const score = this.extractScore(feedback);
    return { feedback, score: score || 5.0 };
  }
}

module.exports = new AIService();

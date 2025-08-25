const scrapeWebsite = require("./scraperService");

class PortfolioService {
  async analyzePortfolio(portfolioUrl) {
    try {
      // Validate URL format
      if (!portfolioUrl || !portfolioUrl.startsWith("http")) {
        throw new Error("Invalid URL format");
      }

      const scrapedData = await scrapeWebsite(portfolioUrl);

      // Basic portfolio evaluation criteria
      const evaluation = {
        overallScore: 0,
        navigation: {
          points: 0,
          maxPoints: 20,
          feedback: [],
        },
        skills: {
          points: 0,
          maxPoints: 20,
          feedback: [],
        },
        projects: {
          points: 0,
          maxPoints: 30,
          feedback: [],
        },
        socialLinks: {
          points: 0,
          maxPoints: 15,
          feedback: [],
        },
        resumeLink: {
          points: 0,
          maxPoints: 10,
          feedback: [],
        },
        technicalFeatures: {
          points: 0,
          maxPoints: 5,
          feedback: [],
        },
      };

      // Analyze scraped content
      if (scrapedData.success && scrapedData.scrapedData.length > 0) {
        const content = scrapedData.scrapedData[0].content;
        const allText = content.visibleTexts
          .map((item) => item.text)
          .join(" ")
          .toLowerCase();
        const allLinks = content.links
          .map((link) => link.href)
          .join(" ")
          .toLowerCase();

        // Navigation analysis
        if (
          allText.includes("about") ||
          allText.includes("contact") ||
          allText.includes("home")
        ) {
          evaluation.navigation.points += 10;
          evaluation.navigation.feedback.push("Good navigation structure");
        } else {
          evaluation.navigation.feedback.push(
            "Missing clear navigation sections"
          );
        }

        if (
          allText.includes("portfolio") ||
          allText.includes("projects") ||
          allText.includes("work")
        ) {
          evaluation.navigation.points += 10;
          evaluation.navigation.feedback.push(
            "Portfolio/projects section found"
          );
        } else {
          evaluation.navigation.feedback.push(
            "Missing dedicated portfolio section"
          );
        }

        // Skills analysis
        const skillKeywords = [
          "javascript",
          "react",
          "node",
          "html",
          "css",
          "python",
          "java",
          "figma",
          "adobe",
          "git",
          "docker",
          "aws",
        ];
        const foundSkills = skillKeywords.filter((skill) =>
          allText.includes(skill)
        );

        if (foundSkills.length >= 3) {
          evaluation.skills.points += 15;
          evaluation.skills.feedback.push(
            `Good technical skills: ${foundSkills.slice(0, 3).join(", ")}`
          );
        } else if (foundSkills.length >= 1) {
          evaluation.skills.points += 10;
          evaluation.skills.feedback.push(
            `Basic skills found: ${foundSkills.join(", ")}`
          );
        } else {
          evaluation.skills.feedback.push("Limited technical skills mentioned");
        }

        if (
          allText.includes("experience") ||
          allText.includes("work history")
        ) {
          evaluation.skills.points += 5;
          evaluation.skills.feedback.push("Experience section present");
        }

        // Projects analysis
        if (
          allText.includes("project") ||
          allText.includes("github") ||
          allText.includes("demo")
        ) {
          evaluation.projects.points += 15;
          evaluation.projects.feedback.push("Projects section found");
        } else {
          evaluation.projects.feedback.push("Missing projects showcase");
        }

        if (allLinks.includes("github.com")) {
          evaluation.projects.points += 10;
          evaluation.projects.feedback.push("GitHub links present");
        } else {
          evaluation.projects.feedback.push("Missing GitHub links");
        }

        if (
          allLinks.includes("vercel.app") ||
          allLinks.includes("netlify.app") ||
          allLinks.includes("heroku.com")
        ) {
          evaluation.projects.points += 5;
          evaluation.projects.feedback.push("Live demo links found");
        } else {
          evaluation.projects.feedback.push("Missing live demo links");
        }

        // Social links analysis
        if (allLinks.includes("linkedin.com")) {
          evaluation.socialLinks.points += 10;
          evaluation.socialLinks.feedback.push("LinkedIn profile linked");
        } else {
          evaluation.socialLinks.feedback.push("Missing LinkedIn profile");
        }

        if (
          allLinks.includes("twitter.com") ||
          allLinks.includes("github.com")
        ) {
          evaluation.socialLinks.points += 5;
          evaluation.socialLinks.feedback.push(
            "Additional social profiles found"
          );
        }

        // Resume link analysis
        if (
          allText.includes("resume") ||
          allText.includes("cv") ||
          allLinks.includes(".pdf")
        ) {
          evaluation.resumeLink.points += 10;
          evaluation.resumeLink.feedback.push("Resume/CV link found");
        } else {
          evaluation.resumeLink.feedback.push("Missing resume/CV link");
        }

        // Technical features analysis
        if (
          allText.includes("responsive") ||
          allText.includes("mobile") ||
          allText.includes("responsive design")
        ) {
          evaluation.technicalFeatures.points += 3;
          evaluation.technicalFeatures.feedback.push(
            "Responsive design mentioned"
          );
        }

        if (
          allText.includes("performance") ||
          allText.includes("optimization") ||
          allText.includes("seo")
        ) {
          evaluation.technicalFeatures.points += 2;
          evaluation.technicalFeatures.feedback.push(
            "Performance/SEO considerations"
          );
        }
      } else {
        evaluation.navigation.feedback.push(
          "Could not analyze portfolio content"
        );
        evaluation.skills.feedback.push("Unable to assess skills");
        evaluation.projects.feedback.push("Unable to assess projects");
        evaluation.socialLinks.feedback.push("Unable to assess social links");
        evaluation.resumeLink.feedback.push("Unable to assess resume link");
        evaluation.technicalFeatures.feedback.push(
          "Unable to assess technical features"
        );
      }

      // Calculate overall score
      evaluation.overallScore = Math.round(
        (evaluation.navigation.points +
          evaluation.skills.points +
          evaluation.projects.points +
          evaluation.socialLinks.points +
          evaluation.resumeLink.points +
          evaluation.technicalFeatures.points) /
          10
      );

      return { evaluation };
    } catch (error) {
      console.error("Portfolio analysis error:", error);

      // Provide more specific error messages
      let errorMessage = "Analysis failed";
      if (error.message.includes("ERR_NAME_NOT_RESOLVED")) {
        errorMessage = "Domain not found - please check the URL";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out - please try again";
      } else if (error.message.includes("ECONNREFUSED")) {
        errorMessage = "Connection refused - please check the URL";
      }

      return {
        evaluation: {
          overallScore: 0,
          navigation: {
            points: 0,
            maxPoints: 20,
            feedback: [errorMessage],
          },
          skills: { points: 0, maxPoints: 20, feedback: [errorMessage] },
          projects: { points: 0, maxPoints: 30, feedback: [errorMessage] },
          socialLinks: {
            points: 0,
            maxPoints: 15,
            feedback: [errorMessage],
          },
          resumeLink: {
            points: 0,
            maxPoints: 10,
            feedback: [errorMessage],
          },
          technicalFeatures: {
            points: 0,
            maxPoints: 5,
            feedback: [errorMessage],
          },
        },
      };
    }
  }
}

module.exports = new PortfolioService();

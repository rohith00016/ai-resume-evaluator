const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const scrapeWebsite = async (url) => {
  if (!url) throw new Error("Missing URL");

  const visited = new Set();
  const scrapedData = [];

  const getAbsoluteUrl = (base, relative) => {
    try {
      return new URL(relative, base).href;
    } catch {
      return null;
    }
  };

  const isSameDomain = (baseUrl, testUrl) => {
    try {
      return new URL(baseUrl).origin === new URL(testUrl).origin;
    } catch {
      return false;
    }
  };

  // Configure Puppeteer for Render.com deployment
  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-extensions",
      "--single-process", // Important for Render.com
    ],
  };

  // For Render.com: Configure cache directory
  const fs = require("fs");
  const path = require("path");
  
  // Set cache directory - prioritize node_modules cache which persists with deployment
  const nodeModulesCache = path.join(process.cwd(), "node_modules", ".cache", "puppeteer");
  const renderCache = process.env.PUPPETEER_CACHE_DIR || "/opt/render/.cache/puppeteer";
  
  // Try node_modules cache first (persists with deployment), then Render cache
  if (fs.existsSync(nodeModulesCache)) {
    process.env.PUPPETEER_CACHE_DIR = nodeModulesCache;
    console.log(`Using node_modules cache: ${nodeModulesCache}`);
  } else if (process.env.RENDER) {
    process.env.PUPPETEER_CACHE_DIR = renderCache;
    console.log(`Using Render cache: ${renderCache}`);
  }

  // Try to use executable path if provided (for Render.com or custom setups)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  let browser;
  
  try {
    // First, try to get Puppeteer's bundled Chrome path and verify it exists
    const puppeteerExecutablePath = puppeteer.executablePath();
    if (puppeteerExecutablePath && fs.existsSync(puppeteerExecutablePath)) {
      console.log(`Using Puppeteer Chrome at: ${puppeteerExecutablePath}`);
      launchOptions.executablePath = puppeteerExecutablePath;
      browser = await puppeteer.launch(launchOptions);
    } else {
      // If path doesn't exist, try to find Chrome in cache directories
      const cacheDirs = [
        nodeModulesCache,
        renderCache,
      ];
      
      let foundPath = null;
      for (const cacheDir of cacheDirs) {
        if (fs.existsSync(cacheDir)) {
          // Look for chrome directory in cache
          const chromeDir = path.join(cacheDir, "chrome");
          if (fs.existsSync(chromeDir)) {
            // Find the version directory (e.g., linux-138.0.7204.168)
            const versionDirs = fs.readdirSync(chromeDir).filter(dir => 
              dir.startsWith("linux-") || dir.startsWith("chrome-")
            );
            
            for (const versionDir of versionDirs) {
              const chromePath = path.join(chromeDir, versionDir, "chrome-linux64", "chrome");
              if (fs.existsSync(chromePath)) {
                foundPath = chromePath;
                console.log(`Found Chrome at: ${foundPath}`);
                break;
              }
            }
            
            if (foundPath) break;
          }
        }
      }
      
      if (foundPath) {
        launchOptions.executablePath = foundPath;
        browser = await puppeteer.launch(launchOptions);
      } else {
        // Try launching without explicit path - let Puppeteer find it
        console.warn("Chrome executable not found at any known path, trying default...");
        delete launchOptions.executablePath;
        browser = await puppeteer.launch(launchOptions);
      }
    }
  } catch (error) {
    // If launch fails, try without specifying executable path
    if (error.message.includes("Could not find Chrome") || error.message.includes("Browser was not found")) {
      console.warn("Chrome not found at configured path, trying without explicit path...");
      delete launchOptions.executablePath;
      try {
        browser = await puppeteer.launch(launchOptions);
      } catch (retryError) {
        throw new Error(`Chrome executable not found. Please ensure Chrome is installed. Run: npx puppeteer browsers install chrome. Error: ${retryError.message}`);
      }
    } else {
      throw error;
    }
  }

  const page = await browser.newPage();
  
  // Set a realistic user agent to avoid bot detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  const crawlAndScrape = async (currentUrl) => {
    if (visited.has(currentUrl)) return;
    visited.add(currentUrl);

    try {
      try {
        await page.goto(currentUrl, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });
      } catch (navigationError) {
        console.warn(
          `Navigation failed for ${currentUrl}:`,
          navigationError.message
        );
        // Try with different wait strategy
        try {
          await page.goto(currentUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
        } catch (fallbackError) {
          console.warn(
            `Fallback navigation also failed for ${currentUrl}:`,
            fallbackError.message
          );
          // Try with load event as last resort
          await page.goto(currentUrl, {
            waitUntil: "load",
            timeout: 20000,
          });
        }
      }

      // Wait for JavaScript to render content (important for SPAs)
      // Smart waiting: check if content is already loaded, otherwise wait
      try {
        // Wait for body to be present (should already be there after navigation)
        await page.waitForSelector("body", { timeout: 2000 });
        
        // Check if meaningful content exists, if not wait a bit more
        const hasContent = await page.evaluate(() => {
          const bodyText = document.body?.innerText || "";
          return bodyText.trim().length > 100; // At least 100 chars of content
        });
        
        if (!hasContent) {
          // Content not loaded yet, wait for it to appear
          await Promise.race([
            page.waitForFunction(
              () => (document.body?.innerText || "").trim().length > 100,
              { timeout: 3000 }
            ).catch(() => null),
            new Promise((resolve) => setTimeout(resolve, 2000))
          ]);
        }
      } catch (e) {
        // If waiting fails, use a minimal fallback delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Extract text directly from the rendered page (better for SPAs)
      const pageText = await page.evaluate(() => {
        const getTextFromElement = (el) => {
          const text = el.innerText || el.textContent || "";
          return text.trim().replace(/\s+/g, " ");
        };

        const texts = [];
        const seenTexts = new Set();
        
        // Get all visible elements
        const allElements = document.querySelectorAll("body *");
        
        allElements.forEach((el) => {
          const tag = el.tagName.toLowerCase();
          const text = getTextFromElement(el);
          
          // Skip script, style, and other non-content elements
          if (
            ["script", "style", "noscript", "meta", "link"].includes(tag) ||
            text.length < 2
          ) {
            return;
          }

          // Only add if it's meaningful text and not already seen
          if (text.length > 2 && !seenTexts.has(text)) {
            // Check if this text is not just a subset of parent's text
            const parent = el.parentElement;
            if (parent) {
              const parentText = getTextFromElement(parent);
              if (parentText === text) {
                return; // Skip if same as parent
              }
            }
            
            texts.push({ tag, text });
            seenTexts.add(text);
          }
        });

        return texts;
      });

      // Also get HTML for link/image extraction
      const html = await page.content();
      const $ = cheerio.load(html);

      const texts = pageText || [];

      // Extract links using both methods for better coverage
      const links = [];
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        let text = $(el).text().trim().replace(/\s+/g, " ");
        
        // If no text, try to get from title, aria-label, or img alt
        if (!text) {
          text = $(el).attr("title") || $(el).attr("aria-label") || "";
          const img = $(el).find("img");
          if (img.length && !text) {
            text = img.attr("alt") || "";
          }
        }
        
        const target = $(el).attr("target");
        const absUrl = getAbsoluteUrl(currentUrl, href);
        if (absUrl && (text || href)) {
          links.push({ 
            href: absUrl, 
            text: text || href, 
            target: target || "none" 
          });
        }
      });

      const images = [];
      $("img").each((_, el) => {
        const src = $(el).attr("src");
        const alt = $(el).attr("alt") || "";
        if (src) images.push({ src: getAbsoluteUrl(currentUrl, src), alt });
      });

      const cssFiles = [];
      $("link[rel='stylesheet']").each((_, el) => {
        const href = $(el).attr("href");
        if (href) cssFiles.push(getAbsoluteUrl(currentUrl, href));
      });

      const jsFiles = [];
      $("script").each((_, el) => {
        const src = $(el).attr("src");
        if (src) jsFiles.push(getAbsoluteUrl(currentUrl, src));
      });

      // Log scraping results for debugging
      console.log(
        `📄 Scraped ${currentUrl}: ${texts.length} text elements, ${links.length} links, ${images.length} images`
      );

      scrapedData.push({
        page: currentUrl,
        content: {
          visibleTexts: texts.slice(0, 200), // Increased limit
          links,
          images,
          cssFiles,
          jsFiles,
        },
      });

      for (const { href } of links) {
        if (isSameDomain(url, href) && !visited.has(href)) {
          await crawlAndScrape(href);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Failed to crawl: ${currentUrl} — ${err.message}`);
    }
  };

  try {
    await crawlAndScrape(url.trim());
  } finally {
    await browser.close();
  }

  // Validate that we scraped meaningful content
  const hasContent = scrapedData.some((page) => {
    const hasTexts = page.content.visibleTexts.length > 0;
    const hasLinks = page.content.links.length > 0;
    const totalTextLength = page.content.visibleTexts.reduce(
      (sum, item) => sum + item.text.length,
      0
    );
    // Consider it successful if we have texts OR links, and at least some meaningful text
    return (hasTexts || hasLinks) && totalTextLength > 50;
  });

  if (!hasContent) {
    console.warn(
      `⚠️ No meaningful content scraped from ${url}. Total pages: ${scrapedData.length}`
    );
  }

  return {
    success: hasContent && scrapedData.length > 0,
    totalPages: scrapedData.length,
    scrapedData,
  };
};

module.exports = scrapeWebsite;

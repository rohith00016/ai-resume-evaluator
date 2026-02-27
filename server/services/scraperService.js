const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cheerio = require("cheerio");

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const scrapeWebsite = async (url) => {
  if (!url) throw new Error("Missing URL");

  const visited = new Set();
  const scrapedData = [];
  const crawlDepth = new Map(); // Track depth for each URL

  // Platform-specific scraping rules configuration
  const PLATFORM_CONFIGS = {
    behance: {
      hostnames: ['behance.net', 'www.behance.net'],
      // Profile URL pattern: behance.net/username
      profilePattern: /^\/[^\/]+$/,
      // Allowed URL patterns (regex)
      allowedPatterns: [
        /^\/[^\/]+$/, // Profile page: /username
        /^\/[^\/]+\/gallery$/, // Profile gallery: /username/gallery
        /^\/gallery\/[^\/]+/, // Project pages: /gallery/PROJECT_ID/...
      ],
      // Blocked URL patterns (regex) - these are platform navigation pages
      blockedPatterns: [
        /^\/about/,
        /^\/blog/,
        /^\/joblist/,
        /^\/search/,
        /^\/hire/,
        /^\/pro/,
        /^\/misc\//,
        /^\/resources\//,
        /^\//, // Root page
      ],
      maxDepth: 3, // Limit crawling depth for platform sites
    },
    // Easy to add more platforms in the future:
    // dribbble: {
    //   hostnames: ['dribbble.com', 'www.dribbble.com'],
    //   profilePattern: /^\/[^\/]+$/,
    //   allowedPatterns: [/^\/[^\/]+$/, /^\/shots\//],
    //   blockedPatterns: [/^\/about/, /^\/contact/],
    //   maxDepth: 2,
    // },
  };

  const getAbsoluteUrl = (base, relative) => {
    // Return null if relative is missing, undefined, null, or invalid
    if (!relative || relative === 'undefined' || relative === 'null' || typeof relative !== 'string' || relative.trim() === '') {
      return null;
    }
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

  // Detect platform from URL
  const detectPlatform = (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      
      for (const [platformName, config] of Object.entries(PLATFORM_CONFIGS)) {
        if (config.hostnames.some(h => h.replace(/^www\./, '') === hostname)) {
          // Check if it matches profile pattern
          if (config.profilePattern.test(urlObj.pathname)) {
            return { platform: platformName, config, urlObj };
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Check if URL should be crawled based on platform rules
  const shouldCrawlLink = (baseUrl, testUrl, platformInfo) => {
    // If not a platform site, use normal logic (crawl same domain)
    if (!platformInfo) {
      return isSameDomain(baseUrl, testUrl);
    }

    const { config, urlObj: baseUrlObj } = platformInfo;
    
    try {
      const testUrlObj = new URL(testUrl);
      
      // Must be same domain
      if (baseUrlObj.origin !== testUrlObj.origin) {
        return false;
      }

      const testPath = testUrlObj.pathname;
      
      // Check blocked patterns first (more specific)
      for (const blockedPattern of config.blockedPatterns) {
        if (blockedPattern.test(testPath)) {
          return false;
        }
      }
      
      // Check allowed patterns
      for (const allowedPattern of config.allowedPatterns) {
        if (allowedPattern.test(testPath)) {
          return true;
        }
      }
      
      // Default: block if no pattern matches
      return false;
    } catch {
      return false;
    }
  };

  // Detect platform and extract context once
  const platformInfo = detectPlatform(url);

  // Configure Puppeteer with stealth options for better anti-detection
  const launchOptions = {
    headless: "new", // Use new headless mode (harder to detect)
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-blink-features=AutomationControlled", // Hide automation
      "--disable-features=IsolateOrigins,site-per-process",
      "--window-size=1920,1080", // Realistic window size
      ...(process.env.RENDER ? ["--single-process"] : []), // Only for Render.com
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
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

  let page = await browser.newPage();
  
  // Set realistic browser properties to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  
  // Override webdriver property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });
  
  // Override plugins
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
  });
  
  // Override languages
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // Helper function to check if error is frame detachment or connection issue
  const isFrameDetachedError = (error) => {
    const errorMsg = error.message || error.toString();
    return errorMsg.includes('detached') || 
           (errorMsg.includes('Frame') && errorMsg.includes('detached')) ||
           errorMsg.includes('Target closed') ||
           errorMsg.includes('Connection closed') ||
           errorMsg.includes('Protocol error');
  };

  // Helper function to check if browser is still connected
  const isBrowserConnected = () => {
    try {
      return browser && browser.isConnected();
    } catch {
      return false;
    }
  };

  // Helper function to get or create a valid page
  const getValidPage = async () => {
    // Check if browser is still connected
    if (!isBrowserConnected()) {
      throw new Error("Browser connection lost");
    }
    
    try {
      // Check if current page is still valid
      if (page && !page.isClosed()) {
        try {
          await page.evaluate(() => document.readyState);
          return page;
        } catch {
          // Page is invalid, create new one
        }
      }
    } catch {
      // Page is invalid, create new one
    }
    
    // Create a new page if current one is invalid
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch {
        // Ignore errors when closing
      }
    }
    
    // Check browser connection before creating new page
    if (!isBrowserConnected()) {
      throw new Error("Browser connection lost - cannot create new page");
    }
    
    page = await browser.newPage();
    
    // Set realistic browser properties
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    
    // Override webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    return page;
  };

  const crawlAndScrape = async (currentUrl, depth = 0) => {
    if (visited.has(currentUrl)) return;
    visited.add(currentUrl);
    crawlDepth.set(currentUrl, depth);

    // Check depth limit for platform sites
    if (platformInfo && platformInfo.config.maxDepth && depth > platformInfo.config.maxDepth) {
      return;
    }

    try {
      // Add delay between requests to avoid rate limiting
      if (visited.size > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
      }

      let currentPage = page;
      let navigationSuccess = false;
      
      // Try navigation with multiple strategies
      const navigationStrategies = [
        { waitUntil: "domcontentloaded", timeout: 60000 },
        { waitUntil: "load", timeout: 45000 },
        { waitUntil: "networkidle0", timeout: 30000 },
      ];
      
      for (let i = 0; i < navigationStrategies.length && !navigationSuccess; i++) {
        try {
          // Check browser connection before each attempt
          if (!isBrowserConnected()) {
            throw new Error("Browser connection lost");
          }
          
          currentPage = await getValidPage();
          const strategy = navigationStrategies[i];
          
          await currentPage.goto(currentUrl, {
            waitUntil: strategy.waitUntil,
            timeout: strategy.timeout,
          });
          
          navigationSuccess = true;
        } catch (navigationError) {
          // Check if it's a frame detachment or connection error
          if (isFrameDetachedError(navigationError)) {
            console.warn(
              `Navigation error (attempt ${i + 1}/${navigationStrategies.length}) for ${currentUrl}: ${navigationError.message}`
            );
            
            // If browser connection is lost, we can't continue
            if (!isBrowserConnected()) {
              throw new Error("Browser connection lost - cannot continue");
            }
            
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000));
            
            // If this was the last strategy, throw error
            if (i === navigationStrategies.length - 1) {
              throw new Error(`Navigation failed after ${navigationStrategies.length} attempts: ${navigationError.message}`);
            }
          } else {
            // For other errors, try next strategy
            if (i === navigationStrategies.length - 1) {
              throw new Error(`Navigation failed: ${navigationError.message}`);
            }
          }
        }
      }
      
      if (!navigationSuccess) {
        throw new Error("Navigation failed with all strategies");
      }
      
      // Update page reference if we got a new one
      if (currentPage !== page) {
        page = currentPage;
      }

      // Wait for JavaScript to render content (important for SPAs like Behance)
      // Smart waiting: check if content is already loaded, otherwise wait
      try {
        // Wait for body to be present
        await page.waitForSelector("body", { timeout: 5000 });
        
        // For Behance and similar SPAs, wait for main content containers
        const contentSelectors = [
          'main',
          '[role="main"]',
          '.content',
          '#content',
          'article',
          '.project',
        ];
        
        // Try to wait for at least one content container
        await Promise.race([
          ...contentSelectors.map(selector => 
            page.waitForSelector(selector, { timeout: 5000 }).catch(() => null)
          ),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
        
        // Check if meaningful content exists
        const hasContent = await page.evaluate(() => {
          const bodyText = document.body?.innerText || "";
          return bodyText.trim().length > 100; // At least 100 chars of content
        });
        
        if (!hasContent) {
          // Content not loaded yet, wait for it to appear with longer timeout for SPAs
          await Promise.race([
            page.waitForFunction(
              () => (document.body?.innerText || "").trim().length > 100,
              { timeout: 10000 } // Longer timeout for SPAs
            ).catch(() => null),
            new Promise((resolve) => setTimeout(resolve, 5000)) // Wait up to 5 seconds
          ]);
        }
        
        // Additional wait for dynamic content to load (especially for Behance)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        // If waiting fails, use a fallback delay
        console.warn(`Content waiting failed for ${currentUrl}, using fallback delay: ${e.message}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
        
        // Skip if href is missing, undefined, null, or invalid
        if (!href || href === 'undefined' || href === 'null' || typeof href !== 'string' || href.trim() === '') {
          return;
        }
        
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
        
        // Only add if we have a valid absolute URL
        if (absUrl && !absUrl.includes('undefined') && !absUrl.includes('null')) {
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
        // Validate href before crawling - skip if invalid or contains undefined/null
        if (href && 
            typeof href === 'string' && 
            !href.includes('undefined') && 
            !href.includes('null') &&
            !visited.has(href)) {
          
          // Use platform-aware link checking
          if (!shouldCrawlLink(url, href, platformInfo)) {
            continue; // Skip links that don't match platform rules
          }
          
          await crawlAndScrape(href, depth + 1);
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

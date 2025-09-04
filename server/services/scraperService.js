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

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();

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
        await page.goto(currentUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
      }

      const html = await page.content();
      const $ = cheerio.load(html);

      const seenTexts = new Set();
      const texts = [];
      $("body *").each((_, el) => {
        const tag = el.tagName;
        const text = $(el).text().trim().replace(/\s+/g, " ");
        if (text.length > 1 && !seenTexts.has(text)) {
          texts.push({ tag, text });
          seenTexts.add(text);
        }
      });

      const links = [];
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim().replace(/\s+/g, " ");
        const target = $(el).attr("target");
        const absUrl = getAbsoluteUrl(currentUrl, href);
        if (absUrl && text) links.push({ href: absUrl, text, target });
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

      scrapedData.push({
        page: currentUrl,
        content: {
          visibleTexts: texts.slice(0, 100),
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

  return {
    success: true,
    totalPages: scrapedData.length,
    scrapedData,
  };
};

module.exports = scrapeWebsite;

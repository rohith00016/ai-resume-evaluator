const pdfParse = require("pdf-parse");

class PdfResumeParser {
  async parse(buffer) {
    const basic = await pdfParse(buffer);
    const text = basic.text || "";

    let embeddedLinks = [];
    try {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      embeddedLinks = await this.extractEmbeddedLinks(pdf);
    } catch (error) {
      // Keep evaluation resilient even if annotation extraction fails.
      console.warn("PDF annotation extraction failed:", error.message);
    }

    return {
      text,
      embeddedLinks,
      pageCount: basic.numpages || 0,
      info: basic.info || {},
      metadata: basic.metadata || null,
    };
  }

  async extractEmbeddedLinks(pdf) {
    const links = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const annotations = await page.getAnnotations();

      for (const annotation of annotations) {
        if (annotation.subtype !== "Link") continue;

        const url = annotation.url || annotation.unsafeUrl || null;
        if (!url) continue;

        links.push({
          page: pageNum,
          url,
          label:
            annotation.titleObj?.str ||
            annotation.contentsObj?.str ||
            annotation.contents ||
            "",
        });
      }
    }

    // Dedupe by URL + page
    const deduped = [];
    const seen = new Set();
    for (const link of links) {
      const key = `${link.page}:${link.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(link);
    }
    return deduped;
  }
}

module.exports = new PdfResumeParser();

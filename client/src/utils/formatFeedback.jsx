import React from "react";

/**
 * Formats raw feedback text into styled, readable HTML
 * Handles markdown-like formatting, headers, lists, and scores
 */
export const formatFeedback = (feedback) => {
  if (!feedback) return "";

  // Clean up the text first
  let cleaned = feedback
    .replace(/W\*W\*/g, "") // Remove W*W* patterns
    .replace(/\*\*/g, "") // Remove double asterisks
    .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisks but keep content
    .trim();

  // Split into lines (keep empty lines for context)
  const lines = cleaned.split("\n");

  const formattedLines = [];
  let inList = false;
  let listType = "ol"; // Track list type
  let consecutiveEmptyLines = 0;
  let lastListItemIndex = -1;
  let lastListItemContent = null;

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

    // Detect headers (lines ending with : and not starting with bullet/number)
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
      // Skip "Portfolio Analysis Summary" header
      if (headerText.includes("portfolio analysis summary")) {
        return;
      }
      // Close list before header
      if (lastListItemContent !== null) {
        formattedLines.push('</li>');
        lastListItemContent = null;
      }
      if (inList) {
        formattedLines.push(`</${listType}>`);
        inList = false;
      }
      formattedLines.push(
        `<h4 class="feedback-header">${trimmed.slice(0, -1)}</h4>`
      );
      return;
    }

    // Detect bullet points - convert to numbered lists
    if (trimmed.match(/^[•\-\*\u2022\u2023\u25E6]\s+/) || trimmed.match(/^[•\-\*]\s/)) {
      const content = trimmed.replace(/^[•\-\*\u2022\u2023\u25E6]\s+/, "").replace(/^[•\-\*]\s/, "").trim();
      if (!content) return;
      
      // Skip section-by-section scores
      const scoreMatch = content.match(/^(.+?):\s*(\d+)\/(\d+)$/);
      if (scoreMatch) {
        const label = scoreMatch[1].toLowerCase();
        const sectionKeywords = ['experience', 'header', 'summary', 'skills', 'education', 'projects', 'achievements', 'certifications'];
        if (sectionKeywords.some(keyword => label.includes(keyword))) {
          return;
        }
        return;
      }
      if (!inList) {
        formattedLines.push('<ol class="feedback-list feedback-numbered">');
        inList = true;
        listType = "ol";
      }
      // Close previous list item if it had additional content
      if (lastListItemContent !== null) {
        formattedLines.push('</li>');
        lastListItemContent = null;
      }
      formattedLines.push(`<li class="feedback-item">${content}</li>`);
      lastListItemIndex = index;
      return;
    }

    // Detect numbered lists
    if (trimmed.match(/^\d+\.\s/)) {
      if (!inList) {
        formattedLines.push('<ol class="feedback-list feedback-numbered">');
        inList = true;
        listType = "ol";
      }
      // Close previous list item if it had additional content
      if (lastListItemContent !== null) {
        formattedLines.push('</li>');
        lastListItemContent = null;
      }
      const content = trimmed.replace(/^\d+\.\s/, "");
      formattedLines.push(`<li class="feedback-item">${content}</li>`);
      lastListItemIndex = index;
      return;
    }

    // Regular paragraph - if in list and more items coming, add to current list item
    if (inList) {
      if (hasMoreListItems && lastListItemIndex >= 0) {
        // More list items coming - add paragraph content to the last list item
        formattedLines.push(
          `<p style="margin:8px 0 0; font-size:14px; color:#475569; line-height:1.75;">${trimmed}</p>`
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
        formattedLines.push(`<p class="feedback-paragraph">${trimmed}</p>`);
      }
    } else {
      // Not in list - check for inline score patterns like "Overall Score: 8/10"
      const scoreMatch = trimmed.match(/^(.+?):\s*(\d+)\/(\d+)$/);
      if (scoreMatch) {
        const [, label, scoreStr, maxStr] = scoreMatch;
        const score = parseInt(scoreStr);
        const max = parseInt(maxStr);
        const labelLower = label.toLowerCase();
        
        // Only show overall score, skip section-by-section scores
        if (labelLower.includes("overall")) {
          // Determine color based on score (0-4: red, 5-7: yellow, 8-10: green)
          let scoreColorClass = 'score-red';
          if (score >= 8) {
            scoreColorClass = 'score-green';
          } else if (score >= 5) {
            scoreColorClass = 'score-yellow';
          }
          
          formattedLines.push(
            `<p class="feedback-score-line"><span class="feedback-label">${label}:</span> <span class="feedback-score ${scoreColorClass}">${score}/${max}</span></p>`
          );
        } else {
          // Skip other score patterns (section-by-section like Experience, Header, etc.)
          const sectionKeywords = ['experience', 'header', 'summary', 'skills', 'education', 'projects', 'achievements', 'certifications'];
          if (!sectionKeywords.some(keyword => labelLower.includes(keyword))) {
            // If it's not a known section, treat as regular paragraph
            formattedLines.push(`<p class="feedback-paragraph">${trimmed}</p>`);
          }
        }
      } else {
        formattedLines.push(`<p class="feedback-paragraph">${trimmed}</p>`);
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
};

/**
 * React component wrapper for formatted feedback
 */
export const FormattedFeedback = ({ feedback, className = "" }) => {
  const formatted = formatFeedback(feedback);
  return (
    <div
      className={`formatted-feedback ${className}`}
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
};


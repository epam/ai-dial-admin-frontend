const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/**
 * Strips all HTML from a rejection comment, leaving plain text — the TypeScript
 * equivalent of the backend's `Jsoup.clean(comment, Safelist.none())`. Script and
 * style blocks are removed wholesale (including their content), remaining tags are
 * dropped, common entities are decoded, and whitespace is collapsed.
 */
export const sanitizeComment = (comment?: string): string => {
  if (!comment) {
    return '';
  }

  return comment
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
};

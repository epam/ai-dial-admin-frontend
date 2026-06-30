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
 * dropped, then common entities are decoded and whitespace is collapsed. Markup is
 * stripped before entities are decoded so that decoded angle brackets can never be
 * re-interpreted as tags.
 */
export const sanitizeComment = (comment?: string): string => {
  if (!comment) {
    return '';
  }

  let stripped = comment;
  let previous: string;

  // Strip markup first, repeating until the result is stable so that
  // reconstructed tags (e.g. `<scr<script>ipt>`) cannot survive a single pass.
  // Once this loop converges no `<` can remain — any `<` would be matched and
  // removed by `<[^>]*>?`, so raw markup such as `<script` can never leak through.
  do {
    previous = stripped;
    stripped = stripped.replace(/<[^>]*>?/g, '');
  } while (stripped !== previous);

  // Decode entities last, on already tag-free text. Decoded angle brackets are
  // therefore kept as literal text and are never re-interpreted as markup, so
  // entity-encoded input cannot be turned back into an executable tag.
  const decoded = stripped.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (entity) => HTML_ENTITIES[entity] ?? entity);

  return decoded.replace(/\s+/g, ' ').trim();
};

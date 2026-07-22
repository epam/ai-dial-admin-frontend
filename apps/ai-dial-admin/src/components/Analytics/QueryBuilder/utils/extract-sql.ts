const FENCED_BLOCK = /```([\w-]*)[^\n]*\r?\n([\s\S]*?)```/g;

export const extractSql = (content: string): string | null => {
  if (!content) {
    return null;
  }

  let lastSqlBlock: string | null = null;
  let lastAnyBlock: string | null = null;

  for (const match of content.matchAll(FENCED_BLOCK)) {
    const lang = match[1].toLowerCase();
    const body = match[2].trim();
    if (!body) {
      continue;
    }
    lastAnyBlock = body;
    if (lang === 'sql') {
      lastSqlBlock = body;
    }
  }

  return lastSqlBlock ?? lastAnyBlock;
};

const FENCED_BLOCK = /```([\w-]*)[^\n]*\r?\n([\s\S]*?)```/g;

interface SplitMessage {
  before: string;
  sql: string;
  after: string;
}

const findLastBlockMatch = (content: string): RegExpMatchArray | null => {
  let lastSqlMatch: RegExpMatchArray | null = null;
  let lastAnyMatch: RegExpMatchArray | null = null;

  for (const match of content.matchAll(FENCED_BLOCK)) {
    const lang = match[1].toLowerCase();
    const body = match[2].trim();
    if (!body) {
      continue;
    }
    lastAnyMatch = match;
    if (lang === 'sql') {
      lastSqlMatch = match;
    }
  }

  return lastSqlMatch ?? lastAnyMatch;
};

export const extractSql = (content: string): string | null => {
  if (!content) {
    return null;
  }
  return findLastBlockMatch(content)?.[2].trim() ?? null;
};

// Same last-block-wins match as `extractSql`, but also returns the surrounding prose so a message can
// render its winning SQL block formatted in place instead of duplicating it as raw fenced text.
export const splitMessageAroundSql = (content: string): SplitMessage | null => {
  if (!content) {
    return null;
  }
  const match = findLastBlockMatch(content);
  if (!match || match.index === undefined) {
    return null;
  }
  return {
    before: content.slice(0, match.index).trim(),
    sql: match[2].trim(),
    after: content.slice(match.index + match[0].length).trim(),
  };
};

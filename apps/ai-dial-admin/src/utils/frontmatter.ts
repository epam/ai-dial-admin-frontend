import { parse, stringify } from 'yaml';

export interface Frontmatter {
  attributes: Record<string, unknown>;
  body: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseFrontmatter = (content: string): Frontmatter => {
  const match = content.match(FRONTMATTER_PATTERN);

  if (match == null) {
    return { attributes: {}, body: content };
  }

  const parsed = parse(match[1]);

  return {
    attributes: isRecord(parsed) ? parsed : {},
    body: content.slice(match[0].length),
  };
};

export const stringifyFrontmatter = (attributes: Record<string, unknown>, body: string): string => {
  const normalizedBody = body.endsWith('\n') ? body : `${body}\n`;

  return `---\n${stringify(attributes)}---\n${normalizedBody}`;
};

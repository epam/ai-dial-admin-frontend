import { FC } from 'react';

interface ContentWithLinksProps {
  text: string;
  linkClassName?: string;
}

type ContentPart = { type: 'text' | 'link'; content: string; url?: string };

const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
const urlRegex = /(https?:\/\/[^\s]+)/g;

const parseUrlsInText = (textSegment: string): ContentPart[] => {
  const parts: ContentPart[] = [];
  const urlMatches = Array.from(textSegment.matchAll(urlRegex));
  let lastIndex = 0;

  urlMatches.forEach((urlMatch) => {
    const beforeUrl = textSegment.substring(lastIndex, urlMatch.index);
    if (beforeUrl) {
      parts.push({ type: 'text', content: beforeUrl });
    }
    parts.push({ type: 'link', content: urlMatch[0], url: urlMatch[0] });
    lastIndex = (urlMatch.index || 0) + urlMatch[0].length;
  });

  const afterLastUrl = textSegment.substring(lastIndex);
  if (afterLastUrl || urlMatches.length === 0) {
    parts.push({ type: 'text', content: afterLastUrl || textSegment });
  }

  return parts;
};

const buildContentParts = (text: string): ContentPart[] => {
  if (!text) {
    return [];
  }

  const markdownLinks: Array<{ start: number; end: number; text: string; url: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    markdownLinks.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
      url: match[2],
    });
  }

  const parts: ContentPart[] = [];
  let lastIndex = 0;

  markdownLinks.forEach((link) => {
    const beforeLink = text.substring(lastIndex, link.start);
    if (beforeLink) {
      parts.push(...parseUrlsInText(beforeLink));
    }
    parts.push({ type: 'link', content: link.text, url: link.url });
    lastIndex = link.end;
  });

  const afterLastLink = text.substring(lastIndex);
  if (afterLastLink) {
    parts.push(...parseUrlsInText(afterLastLink));
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
};

const ContentWithLinks: FC<ContentWithLinksProps> = ({ text, linkClassName = 'text-accent-primary hover:underline' }) => {
  if (!text) {
    return null;
  }

  const parts = buildContentParts(text);

  return (
    <>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a key={index} href={part.url} target="_blank" rel="noopener noreferrer" className={linkClassName}>
            {part.content}
          </a>
        ) : (
          <span key={index}>{part.content}</span>
        ),
      )}
    </>
  );
};

export default ContentWithLinks;
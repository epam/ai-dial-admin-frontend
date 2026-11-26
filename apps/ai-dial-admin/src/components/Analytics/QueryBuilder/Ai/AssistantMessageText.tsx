'use client';

import { FC } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

const ALLOWED_ELEMENTS = ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'del', 'code', 'pre', 'a', 'blockquote'];
const SAFE_URL = /^https?:\/\//i;

const toSafeUrl = (url: string) => (SAFE_URL.test(url) ? url : '');

const COMPONENTS: Components = {
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-layer-sunken px-1 font-mono">{children}</code>,
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded border border-tertiary bg-layer-sunken p-2 font-mono">{children}</pre>
  ),
  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-3">{children}</blockquote>,
  a: ({ children, href }) =>
    href ? (
      <a className="text-accent underline" href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

const AssistantMessageText: FC<Props> = ({ content }) => (
  <div className="dial-small-text flex flex-col gap-2 break-words text-primary">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={COMPONENTS}
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed
      skipHtml
      urlTransform={toSafeUrl}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default AssistantMessageText;

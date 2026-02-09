'use client';
import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import matter from 'gray-matter';

interface Props {
  content: string;
}

const MdViewer: FC<Props> = ({ content }) => {
  const { content: markdown } = matter(content);
  const clean = DOMPurify.sanitize(markdown);

  return (
    <div className="markdown-viewer flex flex-col overflow-scroll small">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>
    </div>
  );
};

export default MdViewer;

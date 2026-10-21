'use client';
import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { parseFrontmatter } from '@/src/utils/frontmatter';

interface Props {
  content: string;
}

const MdViewer: FC<Props> = ({ content }) => {
  const { body: markdown } = parseFrontmatter(content);
  const clean = DOMPurify.sanitize(markdown);

  return (
    <div className="markdown-viewer flex flex-col overflow-scroll dial-small-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>
    </div>
  );
};

export default MdViewer;

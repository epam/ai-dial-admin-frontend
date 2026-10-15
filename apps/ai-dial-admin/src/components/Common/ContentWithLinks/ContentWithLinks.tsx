import { FC } from 'react';

import { buildContentParts } from '@/src/components/Common/ContentWithLinks/utils';

interface Props {
  text: string;
  linkClassName?: string;
}

const ContentWithLinks: FC<Props> = ({
  text,
  linkClassName = 'text-accent-primary hover:underline break-words [overflow-wrap:anywhere]',
}) => {
  if (!text) return null;

  const parts = buildContentParts(text);

  return (
    <span className="break-words [overflow-wrap:anywhere]">
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a key={index} href={part.url} target="_blank" rel="noopener noreferrer" className={linkClassName}>
            {part.content}
          </a>
        ) : (
          <span key={index}>{part.content}</span>
        ),
      )}
    </span>
  );
};

export default ContentWithLinks;

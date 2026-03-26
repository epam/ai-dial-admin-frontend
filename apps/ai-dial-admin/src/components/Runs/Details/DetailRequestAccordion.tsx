'use client';

import { FC } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  title: string;
  content: string;
}

const DetailRequestAccordion: FC<Props> = ({ title, content }) => {
  return (
    <Accordion
      title={title}
      contentPaddingClassName="p-0"
      containerPaddingClassName="p-0"
      containerClassName="p-0 border-0"
    >
      <pre className="p-4 rounded bg-layer-3 text-primary dial-small overflow-x-auto whitespace-pre-wrap break-words">
        {content}
      </pre>
    </Accordion>
  );
};

export default DetailRequestAccordion;

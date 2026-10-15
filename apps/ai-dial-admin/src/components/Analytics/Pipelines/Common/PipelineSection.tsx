'use client';

import { FC, ReactNode } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  /** An anchor other parts of the page can bring into view; the section is then focusable by script. */
  id?: string;
  title: string;
  description?: string;
  isExpanded?: boolean;
  children: ReactNode;
}

const PipelineSection: FC<Props> = ({ id, title, description, isExpanded, children }) => {
  const section = (
    <Accordion title={title} description={description} collapsed={!isExpanded}>
      <div className="flex flex-col gap-y-6">{children}</div>
    </Accordion>
  );

  return id ? (
    <div id={id} tabIndex={-1} className="outline-none">
      {section}
    </div>
  ) : (
    section
  );
};

export default PipelineSection;

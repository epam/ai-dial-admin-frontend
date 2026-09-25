'use client';

import { FC, ReactNode } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  title: string;
  description?: string;
  isExpanded?: boolean;
  children: ReactNode;
}

const PipelineSection: FC<Props> = ({ title, description, isExpanded, children }) => {
  return (
    <Accordion title={title} description={description} collapsed={!isExpanded}>
      <div className="flex flex-col gap-y-6">{children}</div>
    </Accordion>
  );
};

export default PipelineSection;

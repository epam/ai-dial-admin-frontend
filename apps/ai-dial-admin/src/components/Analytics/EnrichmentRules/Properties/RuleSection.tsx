'use client';

import { FC, ReactNode } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';

interface Props {
  title: string;
  // The modal reads straight through, so it renders flat; only the detail page's ~25 members need sections.
  isModal?: boolean;
  isExpanded?: boolean;
  children: ReactNode;
}

const RuleSection: FC<Props> = ({ title, isModal, isExpanded, children }) => {
  if (isModal) {
    return <>{children}</>;
  }

  return (
    <Accordion title={title} collapsed={!isExpanded}>
      <div className="flex flex-col gap-y-6">{children}</div>
    </Accordion>
  );
};

export default RuleSection;

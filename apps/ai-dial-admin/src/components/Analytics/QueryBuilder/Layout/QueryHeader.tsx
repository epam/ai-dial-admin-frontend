'use client';

import { FC, ReactNode } from 'react';

import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';

interface Props {
  title: string;
  description?: string;
  children?: ReactNode;
}

const QueryHeader: FC<Props> = ({ title, description, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="min-w-0 flex-1 truncate dial-h1-text">{title}</h1>
      <div className="flex shrink-0 flex-wrap items-center gap-3">{children}</div>
    </div>
    {description && (
      <ExpandableText lines={1} className="text-secondary dial-small-text">
        {description}
      </ExpandableText>
    )}
  </div>
);

export default QueryHeader;

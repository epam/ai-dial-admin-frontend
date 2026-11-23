'use client';

import { FC, ReactNode } from 'react';

import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';

interface Props {
  title: string;
  badge?: ReactNode;
  subtitle?: ReactNode;
  description?: string;
  children?: ReactNode;
}

const QueryHeader: FC<Props> = ({ title, badge, subtitle, description, children }) => (
  <div className="mb-3 flex flex-col">
    <div className="flex flex-wrap items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="min-w-0 truncate dial-h1-text">{title}</h1>
          {badge}
        </div>
        {subtitle}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">{children}</div>
    </div>
    {description && (
      <ExpandableText lines={1} className="mt-4 text-secondary dial-small-text">
        {description}
      </ExpandableText>
    )}
  </div>
);

export default QueryHeader;

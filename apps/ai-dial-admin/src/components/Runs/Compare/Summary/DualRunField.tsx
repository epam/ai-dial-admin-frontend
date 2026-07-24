'use client';

import { FC, ReactNode } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  label: string;
  primaryRunName: string;
  comparedRunName: string;
  primaryValue: string;
  comparedValue: string;
  primaryPostfix?: ReactNode;
  comparedPostfix?: ReactNode;
}

const DualRunField: FC<Props> = ({
  label,
  primaryRunName,
  comparedRunName,
  primaryValue,
  comparedValue,
  primaryPostfix,
  comparedPostfix,
}) => (
  <div className="flex flex-col gap-1">
    <span className="dial-tiny-text text-secondary">{label}</span>
    <div className="flex flex-col">
      <div className="flex h-6 min-w-0 items-center gap-2">
        <span className="dial-tiny-text shrink-0 text-secondary">{primaryRunName}</span>
        <DialEllipsisTooltip text={primaryValue} className="dial-small-text min-w-0 text-primary" />
        {primaryPostfix}
      </div>
      <div className="flex h-6 min-w-0 items-center gap-2">
        <span className="dial-tiny-text shrink-0 text-secondary">{comparedRunName}</span>
        <DialEllipsisTooltip text={comparedValue} className="dial-small-text min-w-0 text-primary" />
        {comparedPostfix}
      </div>
    </div>
  </div>
);

export default DualRunField;

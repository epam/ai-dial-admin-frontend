'use client';

import { FC } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { DualRunFieldEntry } from '@/src/components/Runs/Compare/Summary/models';

interface Props {
  label: string;
  entries: DualRunFieldEntry[];
}

const DualRunField: FC<Props> = ({ label, entries }) => (
  <div className="flex flex-col gap-1">
    <span className="dial-tiny-text text-secondary">{label}</span>
    <div className="flex flex-col">
      {entries.map(({ key, runName, value, postfix }) => (
        <div key={key} className="flex h-6 min-w-0 items-center gap-2">
          <span className="dial-tiny-text shrink-0 text-secondary">{runName}</span>
          <DialEllipsisTooltip text={value} className="dial-small-text min-w-0 text-primary" />
          {postfix}
        </div>
      ))}
    </div>
  </div>
);

export default DualRunField;

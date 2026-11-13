'use client';

import { FC } from 'react';

import FieldCaveat from '@/src/components/Common/FieldCaveat/FieldCaveat';
import { SpanObjectEntry } from '@/src/models/analytics/sessions-trace';

interface Props {
  label: string;
  entries: SpanObjectEntry[];
  hint?: string;
}

const SpanObjectFactRow: FC<Props> = ({ label, entries, hint }) => (
  <div className="flex flex-col gap-0.5 py-1">
    <span className="flex items-center gap-1 text-secondary dial-tiny-text">
      {label}
      {hint && <FieldCaveat hint={hint} />}
    </span>
    <dl className="flex flex-col gap-1 border-l border-tertiary pl-2">
      {entries.map(({ key, text }) => (
        <div key={key} className="flex min-w-0 flex-col">
          <dt className="break-all font-mono text-secondary dial-tiny-text">{key}</dt>
          <dd className="break-all font-mono text-primary dial-tiny-text">{text}</dd>
        </div>
      ))}
    </dl>
  </div>
);

export default SpanObjectFactRow;

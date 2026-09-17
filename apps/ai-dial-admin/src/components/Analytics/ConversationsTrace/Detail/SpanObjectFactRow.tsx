'use client';

import { FC } from 'react';

import { SpanObjectEntry } from '@/src/models/analytics/conversations-trace';

interface Props {
  label: string;
  entries: SpanObjectEntry[];
}

const SpanObjectFactRow: FC<Props> = ({ label, entries }) => (
  <div className="flex flex-col gap-0.5 py-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
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

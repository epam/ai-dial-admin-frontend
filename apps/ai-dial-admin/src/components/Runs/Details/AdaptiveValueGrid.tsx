'use client';

import { FC } from 'react';

import AdaptiveValueRow from './AdaptiveValueRow';

interface Props {
  title: string;
  entries: Array<[string, string]>;
}

const AdaptiveValueGrid: FC<Props> = ({ title, entries }) => {
  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        {title}
        <span className="flex-1 h-px bg-tertiary" />
      </div>
      <div className="flex flex-col">
        {entries.map(([key, value]) => (
          <AdaptiveValueRow key={key} label={key} value={value} />
        ))}
      </div>
    </section>
  );
};

export default AdaptiveValueGrid;

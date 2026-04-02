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
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3 dial-small-semi">{title}</div>
      <div className="flex flex-col gap-3">
        {entries.map(([key, value]) => (
          <AdaptiveValueRow key={key} label={key} value={value} />
        ))}
      </div>
    </section>
  );
};

export default AdaptiveValueGrid;

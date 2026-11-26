'use client';

import { FC } from 'react';

import { strictNumber } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import Sparkline from '@/src/components/Analytics/Usage/Kpi/Sparkline';
import { formatChartNumber } from '@/src/components/Analytics/Usage/utils/chart-options';

interface Props {
  label: string;
  value: unknown;
  points: number[];
}

const ResultScorecard: FC<Props> = ({ label, value, points }) => {
  const number = strictNumber(value);

  return (
    <div className="flex w-[300px] max-w-full flex-col gap-2 self-start rounded border border-tertiary bg-layer-raised p-4">
      <span className="dial-small-text truncate text-secondary">{label}</span>
      <span className="dial-display2-text leading-none tabular-nums text-primary">
        {number === null ? '—' : formatChartNumber(number)}
      </span>
      {points.length > 1 && (
        <div aria-hidden className="h-10">
          <Sparkline points={points} />
        </div>
      )}
    </div>
  );
};

export default ResultScorecard;

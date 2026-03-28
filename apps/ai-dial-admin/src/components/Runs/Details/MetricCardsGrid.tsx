'use client';

import { FC } from 'react';

import { MetricGroup } from '../View/utils';
import MetricCard from './MetricCard';

interface Props {
  group: MetricGroup;
  onToggleInfo?: () => void;
}

const MetricCardsGrid: FC<Props> = ({ group, onToggleInfo }) => {
  const hasInfos = group.infos != null || group.errorMessage != null;

  return (
    <div className="flex flex-wrap gap-2">
      {group.metrics.map((metric) => (
        <MetricCard
          key={metric.key}
          name={metric.key}
          value={metric.value}
          isError={group.hasError || metric.isError}
          onClick={hasInfos ? onToggleInfo : undefined}
        />
      ))}
    </div>
  );
};

export default MetricCardsGrid;

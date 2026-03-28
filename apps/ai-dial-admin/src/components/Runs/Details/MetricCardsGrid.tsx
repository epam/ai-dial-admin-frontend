'use client';

import { FC } from 'react';

import { MetricGroup } from '../View/utils';
import MetricCard from './MetricCard';

interface Props {
  group: MetricGroup;
  selectedMetricKey?: string;
  onMetricClick?: (key: string) => void;
}

const MetricCardsGrid: FC<Props> = ({ group, selectedMetricKey, onMetricClick }) => {
  const hasInfos = group.infos != null;

  return (
    <div className="flex flex-wrap gap-2">
      {group.metrics.map((metric) => (
        <MetricCard
          key={metric.key}
          name={metric.key}
          value={metric.value}
          isError={group.hasError || metric.isError}
          isSelected={selectedMetricKey === metric.key}
          onClick={hasInfos && group.infos?.[metric.key] ? () => onMetricClick?.(metric.key) : undefined}
        />
      ))}
    </div>
  );
};

export default MetricCardsGrid;

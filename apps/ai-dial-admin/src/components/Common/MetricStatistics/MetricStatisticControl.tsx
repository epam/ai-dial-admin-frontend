'use client';

import { FC, useMemo } from 'react';

import { SegmentedControl, SegmentedControlItem } from '@epam/ai-dial-ui-kit';

interface Props {
  statistics: string[];
  value: string | null;
  onChange: (statistic: string) => void;
  ariaLabel: string;
}

/**
 * Shared AVG/P90/… segmented control for Metric Scores (Summary, Compare) and Metric Trends.
 * Renders nothing when there are no statistics or no selection.
 */
const MetricStatisticControl: FC<Props> = ({ statistics, value, onChange, ariaLabel }) => {
  const options = useMemo<SegmentedControlItem[]>(
    () => statistics.map((statistic) => ({ value: statistic, label: statistic })),
    [statistics],
  );

  if (!options.length || value == null) {
    return null;
  }

  return <SegmentedControl aria-label={ariaLabel} items={options} value={value} onChange={onChange} />;
};

export default MetricStatisticControl;

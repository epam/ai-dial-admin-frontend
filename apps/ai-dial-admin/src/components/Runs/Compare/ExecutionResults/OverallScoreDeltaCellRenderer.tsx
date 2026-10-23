'use client';

import { ICellRendererParams } from 'ag-grid-community';

import MetricDeltaBadge from '@/src/components/Runs/Compare/ExecutionResults/MetricDeltaBadge/MetricDeltaBadge';
import { getMetricDelta } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { GroupedCompareAnalyticsRow } from '@/src/components/Runs/ExecutionResults/models';

const OverallScoreDeltaCellRenderer = ({ data }: ICellRendererParams<GroupedCompareAnalyticsRow>) => {
  const delta = getMetricDelta(data?.primaryScore, data?.comparedScore);

  return <MetricDeltaBadge delta={delta} />;
};

export default OverallScoreDeltaCellRenderer;

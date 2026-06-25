'use client';

import { ICellRendererParams } from 'ag-grid-community';

import MetricDeltaBadge from '@/src/components/Runs/Compare/ExecutionResults/MetricDeltaBadge/MetricDeltaBadge';
import { getMetricDelta } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface CompareDeltaCellRendererParams extends ICellRendererParams<CompareAnalyticsRow> {
  groupKey: string;
  metricKey: string;
}

const CompareDeltaCellRenderer = (params: CompareDeltaCellRendererParams) => {
  const { groupKey, metricKey } = params;

  const primary = params.data?.metricValues?.[groupKey]?.[metricKey];
  const secondary = params.data?._compared?.metricValues?.[groupKey]?.[metricKey];
  const delta = getMetricDelta(primary, secondary);

  return <MetricDeltaBadge delta={delta} />;
};

export default CompareDeltaCellRenderer;

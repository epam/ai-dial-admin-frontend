'use client';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

import { CompareMetricDeltaKind, formatCompareMetricDelta, getCompareMetricDelta } from './compare-metric-utils';

interface CompareDeltaCellRendererParams extends ICellRendererParams<CompareAnalyticsRow> {
  groupKey: string;
  metricKey: string;
}

const CompareDeltaCellRenderer = (params: CompareDeltaCellRendererParams) => {
  const { groupKey, metricKey } = params;

  const primary = params.data?.metricValues?.[groupKey]?.[metricKey];
  const secondary = params.data?._compared?.metricValues?.[groupKey]?.[metricKey];
  const delta = getCompareMetricDelta(primary, secondary);

  if (delta.kind !== CompareMetricDeltaKind.Changed) {
    return null;
  }

  const label = formatCompareMetricDelta(delta);
  if (!label) return null;

  const isPositive = (delta.value ?? 0) > 0;

  return (
    <span
      className={classNames(
        'dial-tiny-text px-2 py-0.5 rounded-full inline-flex items-center font-semibold',
        isPositive ? 'bg-success text-success' : 'bg-error text-error',
      )}
    >
      {label}
    </span>
  );
};

export default CompareDeltaCellRenderer;

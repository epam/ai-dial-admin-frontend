'use client';

import { FC } from 'react';

import classNames from 'classnames';

import {
  formatMetricDelta,
  MetricDelta,
  MetricDeltaKind,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

interface Props {
  delta: MetricDelta;
}

const MetricDeltaBadge: FC<Props> = ({ delta }) => {
  if (delta.kind !== MetricDeltaKind.Changed) {
    return null;
  }

  const label = formatMetricDelta(delta);
  if (!label) return null;

  const isPositive = (delta.value ?? 0) > 0;

  return (
    <span
      className={classNames(
        'dial-tiny-semi-text px-2 py-0.5 rounded-full inline-flex items-center',
        isPositive ? 'bg-success text-success' : 'bg-error text-error',
      )}
    >
      {label}
    </span>
  );
};

export default MetricDeltaBadge;

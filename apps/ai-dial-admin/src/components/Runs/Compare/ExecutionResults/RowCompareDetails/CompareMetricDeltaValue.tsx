'use client';

import { FC } from 'react';

import MetricDeltaBadge from '@/src/components/Runs/Compare/ExecutionResults/MetricDeltaBadge/MetricDeltaBadge';
import { getMetricDelta } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

interface Props {
  primaryRaw: string | null;
  secondaryRaw: string | null;
}

const parseNumericRaw = (raw: string | null): number | null => {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

const CompareMetricDeltaValue: FC<Props> = ({ primaryRaw, secondaryRaw }) => {
  const delta = getMetricDelta(parseNumericRaw(primaryRaw), parseNumericRaw(secondaryRaw));

  return <MetricDeltaBadge delta={delta} />;
};

export default CompareMetricDeltaValue;

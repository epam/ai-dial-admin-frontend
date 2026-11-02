'use client';

import { FC, ReactNode } from 'react';

import { RunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import { formatRunCost } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { NO_DATA_VALUE } from './constants';
import TotalBreakdownValue from './TotalBreakdownValue';

interface Props {
  cost: RunCostState;
  /** The evaluated entity's kind (Model, Application, MCP, Route) or the fallback "Source". */
  sourceLabel: string;
}

/**
 * Total cost with its source / metrics split; with no figure at all the whole value is a single dash.
 * The Error state is not drawn here — the card (or a compare side) replaces this value with an error tag
 * when `cost.hasError`.
 */
const CostValue: FC<Props> = ({ cost, sourceLabel }) => {
  const t = useI18n();
  const calculating: ReactNode = (
    <span className="dial-small-text text-secondary" role="status">
      {t(RunsI18nKey.Calculating)}
    </span>
  );
  const format = (value: number | null): string => formatRunCost(value) ?? NO_DATA_VALUE;
  const metricsLabel = t(TestSuitesI18nKey.TrendsMetricsLabel);

  if (cost.isPending && cost.isMetricsPending) {
    return <TotalBreakdownValue total={calculating} parts={[]} note={t(RunsI18nKey.CostCalculatingElapsed)} />;
  }

  if (cost.isPending) {
    // Zero metrics: the Metrics value is already known to be absent while the source cost is still coming.
    return (
      <TotalBreakdownValue
        total={calculating}
        parts={[
          { label: sourceLabel, value: calculating },
          { label: metricsLabel, value: NO_DATA_VALUE },
        ]}
      />
    );
  }

  if (cost.totalCost == null) {
    return <span className="dial-display2-text text-secondary">{NO_DATA_VALUE}</span>;
  }

  return (
    <TotalBreakdownValue
      total={format(cost.totalCost)}
      parts={[
        { label: sourceLabel, value: format(cost.sourceCost) },
        { label: metricsLabel, value: format(cost.metricsCost) },
      ]}
    />
  );
};

export default CostValue;

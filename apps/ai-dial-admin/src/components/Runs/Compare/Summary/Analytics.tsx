'use client';

import { FC } from 'react';

import { AnalyticsCard, Spinner } from '@epam/ai-dial-ui-kit';

import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { useCompareKpiCards } from '@/src/components/Runs/Compare/Summary/use-compare-kpi-cards';
import { toCompareCardItems, toSlotRecord } from '@/src/components/Runs/Compare/Summary/utils';
import CostValue from '@/src/components/Runs/Summary/Cards/CostValue';
import DeltaBadge from '@/src/components/Runs/Summary/Cards/DeltaBadge';
import ErrorTag from '@/src/components/Runs/Summary/Cards/ErrorTag';
import OverallScoreValue from '@/src/components/Runs/Summary/Cards/OverallScoreValue';
import PassRateValue from '@/src/components/Runs/Summary/Cards/PassRateValue';
import RuntimeValue from '@/src/components/Runs/Summary/Cards/RuntimeValue';
import TestCasesCompletedValue from '@/src/components/Runs/Summary/Cards/TestCasesCompletedValue';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

interface Props {
  primaryRun: Run;
  comparedRun: Run;
  runs: CompareRun[];
  onlyMatchingTestCases: boolean;
  primaryMatchedAnalytics: RunAnalyticsSlice | null;
  comparedMatchedAnalytics: RunAnalyticsSlice | null;
  primaryOverallScore?: number | null;
  comparedOverallScore?: number | null;
  /** How many metrics each run computed; omitted while the snapshots are still loading. */
  primaryMetricCount?: number;
  comparedMetricCount?: number;
}

const KPI_GRID_CLASS = 'grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(min(24rem,100%),1fr))] gap-4';

const CARD_CLASS = 'min-w-0';

const toDeltaValue = (delta: ReturnType<typeof getMetricDelta>): number | undefined =>
  delta.kind === MetricDeltaKind.Changed ? delta.value : undefined;

const Analytics: FC<Props> = ({
  primaryRun,
  comparedRun,
  runs,
  onlyMatchingTestCases,
  primaryMatchedAnalytics,
  comparedMatchedAnalytics,
  primaryOverallScore,
  comparedOverallScore,
  primaryMetricCount,
  comparedMetricCount,
}) => {
  const t = useI18n();
  const kpis = useCompareKpiCards({
    primaryRun,
    comparedRun,
    onlyMatchingTestCases,
    primaryMatchedAnalytics,
    comparedMatchedAnalytics,
    primaryOverallScore,
    comparedOverallScore,
    primaryMetricCount,
    comparedMetricCount,
  });

  if (!kpis) {
    return (
      <div className="flex h-24 items-center">
        <Spinner size={32} fullWidth />
      </div>
    );
  }

  const { figures, sourceLabels, costs, rates, deltas } = kpis;
  const rateTitle = t(kpis.rateTitleKey);
  const scores = toSlotRecord(primaryOverallScore ?? null, comparedOverallScore ?? null);
  const metricCounts = toSlotRecord(primaryMetricCount, comparedMetricCount);

  return (
    <div className={KPI_GRID_CLASS}>
      <AnalyticsCard
        className={CARD_CLASS}
        title={t(RunsI18nKey.TestCasesCompleted)}
        delta={toDeltaValue(deltas.completed)}
        compareValues={toCompareCardItems(runs, (run) => (
          <TestCasesCompletedValue
            breakdown={figures[run.slot].breakdown}
            hasThreshold={figures[run.slot].hasThreshold}
            tooltipTitle={run.name}
          />
        ))}
        error={kpis.hasNoTestCases}
      />
      <AnalyticsCard
        className={CARD_CLASS}
        title={rateTitle}
        delta={deltas.rate ? toDeltaValue(deltas.rate) : undefined}
        deltaUnit="%"
        compareValues={toCompareCardItems(runs, (run) => (
          <PassRateValue
            rate={rates[run.slot]}
            threshold={figures[run.slot].threshold}
            label={`${rateTitle}: ${run.name}`}
          />
        ))}
        error={kpis.hasNoTestCases}
      />
      {kpis.hasOverallScore && (
        <AnalyticsCard
          className={CARD_CLASS}
          title={t(RunsI18nKey.OverallScore)}
          description={t(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)}
          delta={toDeltaValue(deltas.overallScore)}
          compareValues={toCompareCardItems(runs, (run) => (
            <OverallScoreValue
              score={scores[run.slot]}
              threshold={figures[run.slot].threshold}
              isInfoInline
              scoreMethod={kpis.scoreMethods[run.slot]}
              metricCount={metricCounts[run.slot]}
            />
          ))}
        />
      )}
      <AnalyticsCard
        className={CARD_CLASS}
        title={t(RunsI18nKey.TotalRuntime)}
        delta={toDeltaValue(deltas.runtime)}
        deltaPositive={deltas.runtime.value != null && deltas.runtime.value < 0}
        deltaUnit={t(RunsI18nKey.Seconds)}
        compareValues={toCompareCardItems(runs, (run) =>
          kpis.hasRuntimeError[run.slot] ? (
            <ErrorTag />
          ) : (
            <RuntimeValue
              sourceMs={figures[run.slot].sourceMs}
              metricsMs={figures[run.slot].metricsMs}
              sourceLabel={sourceLabels[run.slot]}
            />
          ),
        )}
        error={kpis.hasBothRuntimeErrors}
      />
      <AnalyticsCard
        className={CARD_CLASS}
        title={
          <span className="flex items-center gap-2">
            <span>{t(RunsI18nKey.TotalRunCost)}</span>
            {deltas.costLabel != null && (
              <DeltaBadge label={deltas.costLabel} isPositive={deltas.costLabel.startsWith('-')} />
            )}
          </span>
        }
        compareValues={toCompareCardItems(runs, (run) =>
          costs[run.slot].hasError ? (
            <ErrorTag />
          ) : (
            <CostValue cost={costs[run.slot]} sourceLabel={sourceLabels[run.slot]} />
          ),
        )}
        error={kpis.hasBothCostErrors}
      />
    </div>
  );
};

export default Analytics;

'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  AnalyticsCardVariant,
  DialAnalyticsCard,
  DialAnalyticsHistogram,
  Select,
  ElementSize,
  SelectOption,
} from '@epam/ai-dial-ui-kit';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { getCompareMetricStatCards, toCompareCardItems } from '@/src/components/Runs/Compare/Summary/utils';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import {
  DISTRIBUTION_STAT_CARD_CLASS,
  DISTRIBUTION_STAT_CARDS_GRID_CLASS,
} from '@/src/components/Runs/Summary/constants';
import { MetricOption, MetricScoresData } from '@/src/components/Runs/Summary/models';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { buildDistributionQuery, parseHistogramValues } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  runs: CompareRun[];
  metricOptions: MetricOption[];
  primaryMetricScores: MetricScoresData | null;
  comparedMetricScores: MetricScoresData | null;
  selectedMetricName: string | null;
  onSelectMetric: (name: string | null) => void;
  primaryExcludeEvalSummaryIds?: string[];
  comparedExcludeEvalSummaryIds?: string[];
}

const formatValue = (value: number | null): string => (value == null ? '—' : value.toFixed(3));

const EMPTY_EXCLUDE_EVAL_SUMMARY_IDS: string[] = [];

const DistributionSection: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  runs,
  metricOptions,
  primaryMetricScores,
  comparedMetricScores,
  selectedMetricName,
  onSelectMetric,
  primaryExcludeEvalSummaryIds = EMPTY_EXCLUDE_EVAL_SUMMARY_IDS,
  comparedExcludeEvalSummaryIds = EMPTY_EXCLUDE_EVAL_SUMMARY_IDS,
}) => {
  const t = useI18n();
  const [primaryValues, setPrimaryValues] = useState<number[] | null>(null);
  const [comparedValues, setComparedValues] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const option = metricOptions.find((metric) => metric.name === selectedMetricName);
    if (!primaryRunId || !comparedRunId || !option) {
      setPrimaryValues(null);
      setComparedValues(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      executeStructuredQuery(buildDistributionQuery(primaryRunId, option.field, primaryExcludeEvalSummaryIds)),
      executeStructuredQuery(buildDistributionQuery(comparedRunId, option.field, comparedExcludeEvalSummaryIds)),
    ]).then(([primaryResult, comparedResult]) => {
      if (!cancelled) {
        setPrimaryValues(parseHistogramValues(primaryResult));
        setComparedValues(parseHistogramValues(comparedResult));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    primaryRunId,
    comparedRunId,
    selectedMetricName,
    metricOptions,
    primaryExcludeEvalSummaryIds,
    comparedExcludeEvalSummaryIds,
  ]);

  const options = useMemo<SelectOption[]>(
    () => metricOptions.map((metric) => ({ value: metric.name, label: metric.name })),
    [metricOptions],
  );

  const statCards = useMemo(
    () => getCompareMetricStatCards(primaryMetricScores, comparedMetricScores, selectedMetricName),
    [primaryMetricScores, comparedMetricScores, selectedMetricName],
  );

  const onMetricChange = useCallback((value: string | string[]) => onSelectMetric(value as string), [onSelectMetric]);

  const control = (
    <Select
      size={ElementSize.Small}
      prefix={t(RunsI18nKey.Metric)}
      ariaLabel={t(RunsI18nKey.Metric)}
      options={options}
      value={selectedMetricName ?? undefined}
      placeholder={t(RunsI18nKey.SelectMetric)}
      disabled={options.length === 0}
      onChange={onMetricChange}
      searchable
      searchSize={ElementSize.Small}
    />
  );

  const renderContent = () => {
    if (!selectedMetricName) {
      return <p className="dial-small-text text-secondary">{t(RunsI18nKey.SelectMetricToSeeDistribution)}</p>;
    }
    const valuesBySlot = {
      [CompareRunSlot.Primary]: primaryValues ?? [],
      [CompareRunSlot.Secondary]: comparedValues ?? [],
    };
    const [histogramValues, histogramCompareValues] = runs.map((run) => valuesBySlot[run.slot]);
    const [valueSetLabel, compareValueSetLabel] = runs.map((run) => run.name);

    return (
      <div className="flex flex-col gap-4 [&_[data-histogram-y-axis]]:min-w-4">
        <DialAnalyticsHistogram
          title=""
          values={histogramValues}
          compareValues={histogramCompareValues}
          valueSetLabel={valueSetLabel}
          compareValueSetLabel={compareValueSetLabel}
          valueTitle={t(RunsI18nKey.DistributionValueTitle)}
          isLoading={isLoading || primaryValues === null || comparedValues === null}
        />
        {statCards.length > 0 && (
          <div className={DISTRIBUTION_STAT_CARDS_GRID_CLASS}>
            {statCards.map((card) => {
              const delta = getMetricDelta(card.primaryValue, card.comparedValue);
              return (
                <DialAnalyticsCard
                  key={card.name}
                  variant={AnalyticsCardVariant.Compact}
                  title={card.name}
                  delta={delta.kind === MetricDeltaKind.Changed ? delta.value : undefined}
                  compareValues={toCompareCardItems(runs, (run) =>
                    formatValue(run.slot === CompareRunSlot.Primary ? card.primaryValue : card.comparedValue),
                  )}
                  className={DISTRIBUTION_STAT_CARD_CLASS}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <SummarySection title={t(RunsI18nKey.DistributionTitle)} control={control}>
      {renderContent()}
    </SummarySection>
  );
};

export default DistributionSection;

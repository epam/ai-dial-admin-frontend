'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  AnalyticsCardVariant,
  DialAnalyticsCard,
  DialAnalyticsHistogram,
  DialSelect,
  ElementSize,
  SelectOption,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { getCompareMetricStatCards } from '@/src/components/Runs/Compare/Summary/utils';
import { MetricOption, MetricScoresData } from '@/src/components/Runs/Summary/models';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { buildDistributionQuery, parseHistogramValues } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
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
  primaryRunName,
  comparedRunName,
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
    <DialSelect
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      prefix={t(RunsI18nKey.Metric)}
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
    return (
      <div className="flex flex-col gap-4 [&_[data-histogram-y-axis]]:min-w-4">
        <DialAnalyticsHistogram
          title=""
          values={primaryValues ?? []}
          compareValues={comparedValues ?? []}
          valueSetLabel={primaryRunName}
          compareValueSetLabel={comparedRunName}
          valueTitle={t(RunsI18nKey.DistributionValueTitle)}
          isLoading={isLoading || primaryValues === null || comparedValues === null}
        />
        {statCards.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {statCards.map((card) => {
              const delta = getMetricDelta(card.primaryValue, card.comparedValue);
              return (
                <DialAnalyticsCard
                  key={card.name}
                  variant={AnalyticsCardVariant.Compact}
                  title={card.name}
                  delta={delta.kind === MetricDeltaKind.Changed ? delta.value : undefined}
                  compareValues={[
                    { title: primaryRunName, value: formatValue(card.primaryValue) },
                    { title: comparedRunName, value: formatValue(card.comparedValue) },
                  ]}
                  className="min-w-44"
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

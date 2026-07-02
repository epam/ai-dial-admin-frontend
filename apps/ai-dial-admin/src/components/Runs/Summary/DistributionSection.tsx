'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  AnalyticsCardVariant,
  DialAnalyticsCard,
  DialAnalyticsHistogram,
  DialLoader,
  DialSelect,
  SelectOption,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { MetricOption, MetricScoresData } from './models';
import SummarySection from './SummarySection';
import { buildDistributionQuery, getMetricStatCards, parseHistogramValues } from './utils';

interface Props {
  run: Run;
  /** Selectable metric output fields (shared with the parent); drives the metric dropdown. */
  metricOptions: MetricOption[];
  /** Left-section metric scores, reused to fill the per-statistic cards. `null` while loading. */
  metricScores: MetricScoresData | null;
}

const formatValue = (value: number): string => String(Math.round(value * 100) / 100);

const DistributionSection: FC<Props> = ({ run, metricOptions, metricScores }) => {
  const t = useI18n();
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  const [histogramValues, setHistogramValues] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset the selection whenever the shared options change (e.g. a new run).
  useEffect(() => {
    setSelectedMetricName(null);
  }, [metricOptions]);

  useEffect(() => {
    const option = metricOptions.find((metric) => metric.name === selectedMetricName);
    if (!run?.id || !option) {
      setHistogramValues(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    executeStructuredQuery(buildDistributionQuery(run.id, option.field)).then((result) => {
      if (!cancelled) {
        setHistogramValues(parseHistogramValues(result));
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [run?.id, selectedMetricName, metricOptions]);

  const options = useMemo<SelectOption[]>(
    () => metricOptions.map((metric) => ({ value: metric.name, label: metric.name })),
    [metricOptions],
  );

  const statCards = useMemo(
    () => getMetricStatCards(metricScores, selectedMetricName),
    [metricScores, selectedMetricName],
  );

  const onMetricChange = useCallback((value: string | string[]) => setSelectedMetricName(value as string), []);

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
    />
  );

  const renderContent = () => {
    if (!selectedMetricName) {
      return <p className="dial-small-text text-secondary">{t(RunsI18nKey.SelectMetricToSeeDistribution)}</p>;
    }
    if (isLoading || histogramValues === null) {
      return (
        <div className="flex h-full items-center justify-center">
          <DialLoader size={32} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <DialAnalyticsHistogram
          title={'Average value per test case '}
          values={histogramValues}
          valueTitle={t(RunsI18nKey.DistributionValueTitle)}
        />
        {statCards.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {statCards.map((card) => (
              <DialAnalyticsCard
                key={card.name}
                variant={AnalyticsCardVariant.Compact}
                title={card.name}
                value={formatValue(card.value)}
                className="min-w-44"
              />
            ))}
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

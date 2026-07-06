'use client';

import classNames from 'classnames';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialAnalyticsCard,
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
import { STATUS_DOT_CLASSES } from './constants';
import { MetricOption, TestCaseStatusCounts } from './models';
import {
  buildAvgRunTimeQuery,
  buildOverallScoreQuery,
  buildTestCasesStatusQuery,
  parseAvgRunTimeMs,
  parseOverallScore,
  parseTestCaseStatusCounts,
} from './utils';

interface Props {
  run: Run;
  /** Selectable metric output fields (shared with the parent); drives the metric dropdown. */
  metricOptions: MetricOption[];
}

const StatusDot: FC<{ className: string; count: number; label: string }> = ({ className, count, label }) => (
  <span className={classNames('flex items-center gap-1', className)}>
    <span aria-hidden="true">•</span>
    <span>
      {count} {label}
    </span>
  </span>
);

const Analytics: FC<Props> = ({ run, metricOptions }) => {
  const t = useI18n();
  const [statusCounts, setStatusCounts] = useState<TestCaseStatusCounts | null>(null);
  const [avgRunTimeMs, setAvgRunTimeMs] = useState<number | null>(null);
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [isOverallScoreLoading, setIsOverallScoreLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!run?.id) {
      return;
    }

    let cancelled = false;
    setIsLoaded(false);

    Promise.all([
      executeStructuredQuery(buildTestCasesStatusQuery(run.id)),
      executeStructuredQuery(buildAvgRunTimeQuery(run.id)),
    ]).then(([statusResult, avgResult]) => {
      if (cancelled) {
        return;
      }
      setStatusCounts(parseTestCaseStatusCounts(statusResult));
      setAvgRunTimeMs(parseAvgRunTimeMs(avgResult));
      setIsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [run?.id]);

  // Reset the metric selection whenever the shared options change (e.g. a new run).
  useEffect(() => {
    setSelectedMetricName(null);
  }, [metricOptions]);

  useEffect(() => {
    const option = metricOptions.find((metric) => metric.name === selectedMetricName);
    if (!run?.id || !option) {
      setOverallScore(null);
      setIsOverallScoreLoading(false);
      return;
    }

    let cancelled = false;
    setIsOverallScoreLoading(true);
    executeStructuredQuery(buildOverallScoreQuery(run.id, option)).then((result) => {
      if (!cancelled) {
        setOverallScore(parseOverallScore(result));
        setIsOverallScoreLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [run?.id, selectedMetricName, metricOptions]);

  const metricSelectOptions = useMemo<SelectOption[]>(
    () => metricOptions.map((metric) => ({ value: metric.name, label: metric.name })),
    [metricOptions],
  );

  const onMetricChange = useCallback((value: string | string[]) => setSelectedMetricName(value as string), []);

  if (!isLoaded || !statusCounts) {
    return (
      <div className="flex h-24 items-center">
        <DialLoader size={32} />
      </div>
    );
  }

  const overallScoreDescription: ReactNode = (
    <div className="w-full">
      <DialSelect
        size={SelectSize.Sm}
        variant={SelectVariant.Secondary}
        options={metricSelectOptions}
        value={selectedMetricName ?? undefined}
        placeholder={t(RunsI18nKey.SelectMetric)}
        disabled={metricSelectOptions.length === 0}
        onChange={onMetricChange}
      />
    </div>
  );

  const statusDescription: ReactNode = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <StatusDot className={STATUS_DOT_CLASSES.pass} count={statusCounts.passed} label={t(RunsI18nKey.Pass)} />
      <StatusDot className={STATUS_DOT_CLASSES.fail} count={statusCounts.failed} label={t(RunsI18nKey.Fail)} />
      <StatusDot className={STATUS_DOT_CLASSES.error} count={statusCounts.error} label={t(RunsI18nKey.ExecError)} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      <DialAnalyticsCard
        className="flex-1 sm:max-w-xs"
        title={t(RunsI18nKey.OverallScore)}
        value={overallScore != null ? String(overallScore) : undefined}
        description={overallScoreDescription}
        isLoading={isOverallScoreLoading}
        error={metricSelectOptions.length === 0}
      />
      <DialAnalyticsCard
        className="flex-1 sm:max-w-xs"
        title={t(RunsI18nKey.TestCasesPassed)}
        value={`${statusCounts.passed}/${statusCounts.total}`}
        description={statusDescription}
        error={statusCounts.total === 0}
      />
      <DialAnalyticsCard
        className="flex-1 sm:max-w-xs"
        title={t(RunsI18nKey.AvgTestCaseRunTime)}
        value={avgRunTimeMs != null ? `${Math.round(avgRunTimeMs / 100) / 10} ${t(RunsI18nKey.Seconds)}` : undefined}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgRunTimeMs == null}
      />
    </div>
  );
};

export default Analytics;

'use client';

import classNames from 'classnames';
import { FC, ReactNode, useEffect, useState } from 'react';

import { DialAnalyticsCard, DialLoader } from '@epam/ai-dial-ui-kit';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { STATUS_DOT_CLASSES } from './constants';
import { TestCaseStatusCounts } from './models';
import { buildAvgRunTimeQuery, buildTestCasesStatusQuery, parseAvgRunTimeMs, parseTestCaseStatusCounts } from './utils';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
}

const StatusDot: FC<{ className: string; count: number; label: string }> = ({ className, count, label }) => (
  <span className={classNames('flex items-center gap-1', className)}>
    <span aria-hidden="true">•</span>
    <span>
      {count} {label}
    </span>
  </span>
);

const Analytics: FC<Props> = ({ run, overallScore }) => {
  const t = useI18n();
  const [statusCounts, setStatusCounts] = useState<TestCaseStatusCounts | null>(null);
  const [avgRunTimeMs, setAvgRunTimeMs] = useState<number | null>(null);
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

  if (!isLoaded || !statusCounts) {
    return (
      <div className="flex h-24 items-center">
        <DialLoader size={32} />
      </div>
    );
  }

  const statusDescription: ReactNode = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <StatusDot className={STATUS_DOT_CLASSES.pass} count={statusCounts.passed} label={t(RunsI18nKey.Pass)} />
      <StatusDot className={STATUS_DOT_CLASSES.fail} count={statusCounts.failed} label={t(RunsI18nKey.Fail)} />
      <StatusDot className={STATUS_DOT_CLASSES.error} count={statusCounts.error} label={t(RunsI18nKey.ExecError)} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      {overallScore != null && (
        <DialAnalyticsCard
          className="flex-1 sm:max-w-xs"
          title={t(RunsI18nKey.OverallScore)}
          value={String(overallScore)}
          description={t(RunsI18nKey.OverallScoreDescription)}
        />
      )}
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

'use client';

import classNames from 'classnames';
import { FC } from 'react';

import RunsPassedThresholdCard from '@/src/components/TestSuites/Trends/RunsPassedThresholdCard';
import ScoreRangeCard from '@/src/components/TestSuites/Trends/ScoreRangeCard';
import TrendsKpiCard from '@/src/components/TestSuites/Trends/TrendsKpiCard';
import { TrendsKpiData } from '@/src/components/TestSuites/Trends/models';
import { formatScore, formatSuiteRunTime } from '@/src/components/TestSuites/Trends/utils/format';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  kpis: TrendsKpiData;
}

const KpiStrip: FC<Props> = ({ kpis }) => {
  const t = useI18n();
  const runsLabel = t(TestSuitesI18nKey.TrendsRunsCount, { count: kpis.runCount });
  const titleWithRuns = (title: string) => `${title} · ${runsLabel}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch">
      <TrendsKpiCard
        className="flex-1 sm:min-w-[180px]"
        title={titleWithRuns(t(RunsI18nKey.OverallScore))}
        value={kpis.latestOverallScore != null ? formatScore(kpis.latestOverallScore) : undefined}
        description={t(RunsI18nKey.OverallScoreDescription)}
        isError={kpis.latestOverallScore == null}
      />
      <TrendsKpiCard
        className="flex-1 sm:min-w-[180px]"
        title={titleWithRuns(t(TestSuitesI18nKey.AvgTestSuiteRunTime))}
        value={kpis.avgRunTimeMs != null ? formatSuiteRunTime(kpis.avgRunTimeMs) : undefined}
        description={t(TestSuitesI18nKey.AvgPerRuns, { count: kpis.runCount })}
        isError={kpis.avgRunTimeMs == null}
      />
      <ScoreRangeCard
        className={classNames('flex-1 sm:min-w-[180px]')}
        title={titleWithRuns(t(TestSuitesI18nKey.ScoreRange))}
        scoreMin={kpis.scoreMin}
        scoreMax={kpis.scoreMax}
        latestScore={kpis.latestScore}
        runCount={kpis.runCount}
      />
      {kpis.thresholdStats != null && (
        <RunsPassedThresholdCard className="flex-1 sm:min-w-[180px]" stats={kpis.thresholdStats} />
      )}
    </div>
  );
};

export default KpiStrip;

'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { executeStructuredQuery, getMetricSnapshots } from '@/src/app/[lang]/runs/actions';
import { getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { SummaryTabUiState } from '@/src/components/Runs/View/models';
import { RUN_FILTER } from '@/src/components/Runs/View/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Analytics from './Analytics';
import DistributionSection from './DistributionSection';
import Header from './Header';
import MetricScoresSection from './MetricScoresSection';
import { OVERALL_METRIC_SCORE_NAME } from './constants';
import { MetricOption, MetricScoresData } from './models';
import {
  buildMetricScoresQuery,
  buildTestCasesStatusQuery,
  parseMetricScores,
  parseTestCaseStatusCounts,
  toMetricOptions,
} from './utils';

interface Props {
  run: Run;
  summaryState: SummaryTabUiState;
  setSummaryState: (patch: Partial<SummaryTabUiState>) => void;
}

const SummaryTab: FC<Props> = ({ run, summaryState, setSummaryState }) => {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [metricScores, setMetricScores] = useState<MetricScoresData | null>(null);
  const [metricOptions, setMetricOptions] = useState<MetricOption[]>([]);
  const [testCaseCount, setTestCaseCount] = useState(0);
  const { selectedStatistic } = summaryState;

  useEffect(() => {
    if (!metricScores) {
      return;
    }

    const isStaleOverall = selectedStatistic === OVERALL_METRIC_SCORE_NAME;
    const isMissingSelection = selectedStatistic == null;
    if (!isStaleOverall && !isMissingSelection) {
      return;
    }

    const defaultStatistic = metricScores.statistics[0] ?? null;
    if (defaultStatistic) {
      setSummaryState({ selectedStatistic: defaultStatistic });
    }
  }, [metricScores, selectedStatistic, setSummaryState]);

  useEffect(() => {
    if (!run?.testSuiteId) {
      setTestSuite(null);
      return;
    }

    getTestSuite(run.testSuiteId, DEFAULT_ETAG).then((res) => {
      setTestSuite((res?.response as TestSuite | null) ?? null);
    });
  }, [run?.testSuiteId]);

  useEffect(() => {
    if (!run?.id) {
      setMetricScores(null);
      setMetricOptions([]);
      setTestCaseCount(0);
      return;
    }

    let cancelled = false;
    setMetricScores(null);

    executeStructuredQuery(buildMetricScoresQuery(run.id)).then((result) => {
      if (!cancelled) {
        setMetricScores(parseMetricScores(result));
      }
    });

    executeStructuredQuery(buildTestCasesStatusQuery(run.id)).then((result) => {
      if (!cancelled) {
        setTestCaseCount(parseTestCaseStatusCounts(result).total);
      }
    });

    getMetricSnapshots(RUN_FILTER(run.id)).then((snapshots) => {
      if (!cancelled) {
        setMetricOptions(toMetricOptions(snapshots));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [run?.id]);

  const onSelectStatistic = useCallback(
    (statistic: string) => setSummaryState({ selectedStatistic: statistic }),
    [setSummaryState],
  );

  const onSelectDistributionMetric = useCallback(
    (name: string | null) => setSummaryState({ selectedDistributionMetricName: name }),
    [setSummaryState],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-8">
      <Header run={run} testSuite={testSuite} />
      <Analytics run={run} overallScore={metricScores?.overallScore} />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <MetricScoresSection
          data={metricScores}
          testCaseCount={testCaseCount}
          selectedStatistic={summaryState.selectedStatistic}
          onSelectStatistic={onSelectStatistic}
          onSelectMetric={(name) => onSelectDistributionMetric(name)}
        />
        <DistributionSection
          run={run}
          metricOptions={metricOptions}
          metricScores={metricScores}
          selectedMetricName={summaryState.selectedDistributionMetricName}
          onSelectMetric={onSelectDistributionMetric}
        />
      </div>
    </div>
  );
};

export default SummaryTab;

'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { executeStructuredQuery, getMetricSnapshots } from '@/src/app/[lang]/runs/actions';
import { getMetricLatestVersion, getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { SummaryTabUiState } from '@/src/components/Runs/View/models';
import { RUN_FILTER } from '@/src/components/Runs/View/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Metric } from '@/src/models/evaluation/metric';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Analytics from './Analytics';
import DistributionSection from './DistributionSection';
import Header from './Header';
import MetricScoresSection from './MetricScoresSection';
import { OVERALL_METRIC_SCORE_NAME } from './constants';
import { MetricInfo, MetricOption, MetricScoresData } from './models';
import {
  attachMetricInfo,
  buildMaxTurnsQuery,
  buildMetricScoresQuery,
  parseHasMultiTurn,
  parseMetricScores,
  toMetricInfoByName,
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
  const [metricInfoByName, setMetricInfoByName] = useState<Record<string, MetricInfo>>({});
  const [isMultiTurn, setIsMultiTurn] = useState(false);
  const { selectedStatistic } = summaryState;

  const enrichedMetricScores = useMemo(
    () => (metricScores ? attachMetricInfo(metricScores, metricInfoByName) : metricScores),
    [metricScores, metricInfoByName],
  );

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
      setMetricInfoByName({});
      setIsMultiTurn(false);
      return;
    }

    let cancelled = false;
    setMetricScores(null);
    setMetricInfoByName({});
    setIsMultiTurn(false);

    executeStructuredQuery(buildMetricScoresQuery(run.id)).then((result) => {
      if (!cancelled) {
        setMetricScores(parseMetricScores(result));
      }
    });

    executeStructuredQuery(buildMaxTurnsQuery(run.id)).then((result) => {
      if (!cancelled) {
        setIsMultiTurn(parseHasMultiTurn(result));
      }
    });

    getMetricSnapshots(RUN_FILTER(run.id)).then(async (snapshots) => {
      if (cancelled) {
        return;
      }
      setMetricOptions(toMetricOptions(snapshots));

      const declarationIds = Array.from(
        new Set((snapshots ?? []).map((snapshot) => snapshot.metricDeclarationId).filter(Boolean)),
      ) as string[];
      const declarations = await Promise.all(declarationIds.map((id) => getMetricLatestVersion(id)));
      if (cancelled) {
        return;
      }

      const declarationsById: Record<string, Metric> = {};
      declarationIds.forEach((id, index) => {
        const declaration = declarations[index];
        if (declaration) {
          declarationsById[id] = declaration;
        }
      });
      setMetricInfoByName(toMetricInfoByName(snapshots, declarationsById));
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
      <Analytics run={run} overallScore={enrichedMetricScores?.overallScore} isMultiTurn={isMultiTurn} />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <MetricScoresSection
          data={enrichedMetricScores}
          selectedStatistic={summaryState.selectedStatistic}
          onSelectStatistic={onSelectStatistic}
          onSelectMetric={(name) => onSelectDistributionMetric(name)}
          isMultiTurn={isMultiTurn}
        />
        <DistributionSection
          run={run}
          metricOptions={metricOptions}
          metricScores={enrichedMetricScores}
          selectedMetricName={summaryState.selectedDistributionMetricName}
          onSelectMetric={onSelectDistributionMetric}
          isMultiTurn={isMultiTurn}
        />
      </div>
    </div>
  );
};

export default SummaryTab;

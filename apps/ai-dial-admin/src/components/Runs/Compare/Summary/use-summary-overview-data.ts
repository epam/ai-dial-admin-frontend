'use client';

import { useEffect, useMemo, useState } from 'react';

import { executeStructuredQuery, getMetricSnapshots, getRun } from '@/src/app/[lang]/runs/actions';
import { getMetricLatestVersion, getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { intersectStatistics, unionMetricOptions } from '@/src/components/Runs/Compare/Summary/utils';
import { SummaryOverviewTabUiState } from '@/src/components/Runs/Compare/models';
import { OVERALL_METRIC_SCORE_NAME } from '@/src/components/Runs/Summary/constants';
import { MetricInfo, MetricOption, MetricScoresData } from '@/src/components/Runs/Summary/models';
import {
  attachMetricInfo,
  buildMetricScoresQuery,
  parseMetricScores,
  toMetricInfoByName,
  toMetricOptions,
} from '@/src/components/Runs/Summary/utils';
import { RUN_FILTER } from '@/src/components/Runs/View/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Metric } from '@/src/models/evaluation/metric';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Params {
  primaryRunId: string;
  comparedRunId: string;
  summaryState: SummaryOverviewTabUiState;
  setSummaryState: (patch: Partial<SummaryOverviewTabUiState>) => void;
}

export const useSummaryOverviewData = ({ primaryRunId, comparedRunId, summaryState, setSummaryState }: Params) => {
  const [primaryRun, setPrimaryRun] = useState<Run | null>(null);
  const [comparedRun, setComparedRun] = useState<Run | null>(null);
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [primaryMetricScores, setPrimaryMetricScores] = useState<MetricScoresData | null>(null);
  const [comparedMetricScores, setComparedMetricScores] = useState<MetricScoresData | null>(null);
  const [primaryMetricOptions, setPrimaryMetricOptions] = useState<MetricOption[]>([]);
  const [comparedMetricOptions, setComparedMetricOptions] = useState<MetricOption[]>([]);
  const [metricInfoByName, setMetricInfoByName] = useState<Record<string, MetricInfo>>({});
  const { selectedStatistic } = summaryState;

  const enrichedPrimaryScores = useMemo(
    () => (primaryMetricScores ? attachMetricInfo(primaryMetricScores, metricInfoByName) : primaryMetricScores),
    [primaryMetricScores, metricInfoByName],
  );

  const enrichedComparedScores = useMemo(
    () => (comparedMetricScores ? attachMetricInfo(comparedMetricScores, metricInfoByName) : comparedMetricScores),
    [comparedMetricScores, metricInfoByName],
  );

  const metricOptions = useMemo(
    () => unionMetricOptions(primaryMetricOptions, comparedMetricOptions),
    [primaryMetricOptions, comparedMetricOptions],
  );

  useEffect(() => {
    if (!primaryMetricScores || !comparedMetricScores) {
      return;
    }

    const statistics = intersectStatistics(primaryMetricScores.statistics, comparedMetricScores.statistics);
    const isStaleOverall = selectedStatistic === OVERALL_METRIC_SCORE_NAME;
    const isMissingSelection = selectedStatistic == null || !statistics.includes(selectedStatistic);
    if (!isStaleOverall && !isMissingSelection) {
      return;
    }

    const defaultStatistic = statistics[0] ?? null;
    if (defaultStatistic) {
      setSummaryState({ selectedStatistic: defaultStatistic });
    }
  }, [primaryMetricScores, comparedMetricScores, selectedStatistic, setSummaryState]);

  useEffect(() => {
    let cancelled = false;
    setPrimaryRun(null);
    setComparedRun(null);

    Promise.all([getRun(primaryRunId), getRun(comparedRunId)]).then(([primary, compared]) => {
      if (!cancelled) {
        setPrimaryRun(primary ?? null);
        setComparedRun(compared ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [primaryRunId, comparedRunId]);

  useEffect(() => {
    const suiteId = primaryRun?.testSuiteId ?? comparedRun?.testSuiteId;
    if (!suiteId) {
      setTestSuite(null);
      return;
    }

    let cancelled = false;
    getTestSuite(suiteId, DEFAULT_ETAG).then((res) => {
      if (!cancelled) {
        setTestSuite((res?.response as TestSuite | null) ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [primaryRun?.testSuiteId, comparedRun?.testSuiteId]);

  useEffect(() => {
    if (!primaryRunId || !comparedRunId) {
      setPrimaryMetricScores(null);
      setComparedMetricScores(null);
      setPrimaryMetricOptions([]);
      setComparedMetricOptions([]);
      setMetricInfoByName({});
      return;
    }

    let cancelled = false;
    setPrimaryMetricScores(null);
    setComparedMetricScores(null);
    setMetricInfoByName({});

    Promise.all([
      executeStructuredQuery(buildMetricScoresQuery(primaryRunId)),
      executeStructuredQuery(buildMetricScoresQuery(comparedRunId)),
    ]).then(([primaryResult, comparedResult]) => {
      if (!cancelled) {
        setPrimaryMetricScores(parseMetricScores(primaryResult));
        setComparedMetricScores(parseMetricScores(comparedResult));
      }
    });

    Promise.all([getMetricSnapshots(RUN_FILTER(primaryRunId)), getMetricSnapshots(RUN_FILTER(comparedRunId))]).then(
      async ([primarySnapshots, comparedSnapshots]) => {
        if (cancelled) {
          return;
        }
        setPrimaryMetricOptions(toMetricOptions(primarySnapshots));
        setComparedMetricOptions(toMetricOptions(comparedSnapshots));

        const allSnapshots = [...(primarySnapshots ?? []), ...(comparedSnapshots ?? [])];
        const declarationIds = Array.from(
          new Set(allSnapshots.map((snapshot) => snapshot.metricDeclarationId).filter(Boolean)),
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
        setMetricInfoByName(toMetricInfoByName(allSnapshots, declarationsById));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [primaryRunId, comparedRunId]);

  return {
    primaryRun,
    comparedRun,
    testSuite,
    enrichedPrimaryScores,
    enrichedComparedScores,
    metricOptions,
  };
};

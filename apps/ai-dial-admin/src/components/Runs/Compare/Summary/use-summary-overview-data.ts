'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  executeStructuredQuery,
  getMetricScoresComparison,
  getMetricSnapshots,
  getRun,
} from '@/src/app/[lang]/runs/actions';
import { getMetricLatestVersion, getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { intersectStatistics, unionMetricOptions } from '@/src/components/Runs/Compare/Summary/utils';
import { SummaryOverviewTabUiState } from '@/src/components/Runs/Compare/models';
import { OVERALL_METRIC_SCORE_NAME } from '@/src/components/Runs/Summary/constants';
import {
  MetricInfo,
  MetricOption,
  MetricScoresData,
  RunAnalyticsSlice,
  TestCaseStatusCounts,
} from '@/src/components/Runs/Summary/models';
import {
  attachMetricInfo,
  buildMetricScoresQuery,
  buildTestCasesStatusQuery,
  parseComparisonMetricScores,
  parseMetricScores,
  parseTestCaseStatusCounts,
  toMetricInfoByName,
  toMetricOptions,
} from '@/src/components/Runs/Summary/utils';
import { RUN_FILTER } from '@/src/components/Runs/View/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { RunComparisonRun } from '@/src/models/evaluation/run-comparison';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification } from '@/src/utils/notification';

interface Params {
  primaryRunId: string;
  comparedRunId: string;
  onlyMatchingTestCases: boolean;
  summaryState: SummaryOverviewTabUiState;
  setSummaryState: (patch: Partial<SummaryOverviewTabUiState>) => void;
}

const EMPTY_STATUS_COUNTS: TestCaseStatusCounts = { passed: 0, failed: 0, error: 0, total: 0 };

const EMPTY_METRIC_SCORES: MetricScoresData = { overallScore: null, statistics: [], byStatistic: {} };

const EMPTY_MATCHED_ANALYTICS: RunAnalyticsSlice = {
  statusCounts: EMPTY_STATUS_COUNTS,
  avgRunTimeMs: null,
};

const toMatchedAnalyticsSlice = (
  run: RunComparisonRun | undefined,
  statusCounts: TestCaseStatusCounts,
): RunAnalyticsSlice => ({
  statusCounts,
  avgRunTimeMs: run?.avgExecDurationMs ?? null,
});

const findComparisonRun = (runs: RunComparisonRun[] | undefined, runId: string): RunComparisonRun | undefined =>
  runs?.find((run) => run.runId === runId);

interface ComparisonRunDerived {
  scores: MetricScoresData;
  unmatchedIds: string[];
  analytics: RunAnalyticsSlice;
}

const applyComparisonRun = (
  run: RunComparisonRun | undefined,
  statusCounts: TestCaseStatusCounts = EMPTY_STATUS_COUNTS,
): ComparisonRunDerived => ({
  scores: parseComparisonMetricScores(run?.scores),
  unmatchedIds: run?.unmatchedEvalSummaryIds ?? [],
  analytics: toMatchedAnalyticsSlice(run, statusCounts),
});

export const useSummaryOverviewData = ({
  primaryRunId,
  comparedRunId,
  onlyMatchingTestCases,
  summaryState,
  setSummaryState,
}: Params) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const notifiedComparisonErrorRef = useRef(false);
  const showNotificationRef = useRef(showNotification);
  const tRef = useRef(t);
  showNotificationRef.current = showNotification;
  tRef.current = t;

  const [primaryRun, setPrimaryRun] = useState<Run | null>(null);
  const [comparedRun, setComparedRun] = useState<Run | null>(null);
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [primaryMetricScores, setPrimaryMetricScores] = useState<MetricScoresData | null>(null);
  const [comparedMetricScores, setComparedMetricScores] = useState<MetricScoresData | null>(null);
  const [primaryMetricOptions, setPrimaryMetricOptions] = useState<MetricOption[]>([]);
  const [comparedMetricOptions, setComparedMetricOptions] = useState<MetricOption[]>([]);
  const [metricInfoByName, setMetricInfoByName] = useState<Record<string, MetricInfo>>({});
  const [primaryMatchedAnalytics, setPrimaryMatchedAnalytics] = useState<RunAnalyticsSlice | null>(null);
  const [comparedMatchedAnalytics, setComparedMatchedAnalytics] = useState<RunAnalyticsSlice | null>(null);
  const [primaryUnmatchedIds, setPrimaryUnmatchedIds] = useState<string[]>([]);
  const [comparedUnmatchedIds, setComparedUnmatchedIds] = useState<string[]>([]);
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
    const resetMatchedState = () => {
      setPrimaryMetricScores(null);
      setComparedMetricScores(null);
      setPrimaryMatchedAnalytics(null);
      setComparedMatchedAnalytics(null);
      setPrimaryUnmatchedIds([]);
      setComparedUnmatchedIds([]);
    };

    const applyEmptyComparison = () => {
      setPrimaryMetricScores(EMPTY_METRIC_SCORES);
      setComparedMetricScores(EMPTY_METRIC_SCORES);
      setPrimaryMatchedAnalytics(EMPTY_MATCHED_ANALYTICS);
      setComparedMatchedAnalytics(EMPTY_MATCHED_ANALYTICS);
      setPrimaryUnmatchedIds([]);
      setComparedUnmatchedIds([]);
    };

    resetMatchedState();
    notifiedComparisonErrorRef.current = false;

    if (!primaryRunId || !comparedRunId) {
      return;
    }

    let cancelled = false;

    if (onlyMatchingTestCases) {
      getMetricScoresComparison(primaryRunId, comparedRunId).then(async (response) => {
        if (cancelled) {
          return;
        }
        if (!response?.runs?.length) {
          applyEmptyComparison();
          if (!notifiedComparisonErrorRef.current) {
            notifiedComparisonErrorRef.current = true;
            showNotificationRef.current(
              getErrorNotification(tRef.current(RunsI18nKey.RunCompareMatchedScoresLoadFailed)),
            );
          }
          return;
        }

        const primaryComparison = findComparisonRun(response.runs, primaryRunId);
        const comparedComparison = findComparisonRun(response.runs, comparedRunId);
        const primaryPartial = applyComparisonRun(primaryComparison);
        const comparedPartial = applyComparisonRun(comparedComparison);

        setPrimaryMetricScores(primaryPartial.scores);
        setComparedMetricScores(comparedPartial.scores);
        setPrimaryUnmatchedIds(primaryPartial.unmatchedIds);
        setComparedUnmatchedIds(comparedPartial.unmatchedIds);

        const [primaryStatusResult, comparedStatusResult] = await Promise.all([
          executeStructuredQuery(buildTestCasesStatusQuery(primaryRunId, primaryPartial.unmatchedIds)),
          executeStructuredQuery(buildTestCasesStatusQuery(comparedRunId, comparedPartial.unmatchedIds)),
        ]);
        if (cancelled) {
          return;
        }

        setPrimaryMatchedAnalytics(
          toMatchedAnalyticsSlice(primaryComparison, parseTestCaseStatusCounts(primaryStatusResult)),
        );
        setComparedMatchedAnalytics(
          toMatchedAnalyticsSlice(comparedComparison, parseTestCaseStatusCounts(comparedStatusResult)),
        );
      });
    } else {
      Promise.all([
        executeStructuredQuery(buildMetricScoresQuery(primaryRunId)),
        executeStructuredQuery(buildMetricScoresQuery(comparedRunId)),
      ]).then(([primaryResult, comparedResult]) => {
        if (!cancelled) {
          setPrimaryMetricScores(parseMetricScores(primaryResult));
          setComparedMetricScores(parseMetricScores(comparedResult));
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [primaryRunId, comparedRunId, onlyMatchingTestCases]);

  useEffect(() => {
    if (!primaryRunId || !comparedRunId) {
      setPrimaryMetricOptions([]);
      setComparedMetricOptions([]);
      setMetricInfoByName({});
      return;
    }

    let cancelled = false;
    setMetricInfoByName({});

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
    primaryMatchedAnalytics,
    comparedMatchedAnalytics,
    primaryUnmatchedIds,
    comparedUnmatchedIds,
  };
};

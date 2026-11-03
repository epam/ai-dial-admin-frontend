'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  executeStructuredQuery,
  getMetricScoresComparison,
  getMetricSnapshots,
  getRun,
} from '@/src/app/[lang]/runs/actions';
import { getMetricLatestVersion, getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { unionMetricOptions, unionStatistics } from '@/src/components/Runs/Compare/Summary/utils';
import { SummaryOverviewTabUiState } from '@/src/components/Runs/Compare/models';
import {
  OVERALL_METRIC_SCORE_NAME,
  TOTAL_DURATION_ALIAS,
  TOTAL_METRIC_EVAL_DURATION_ALIAS,
} from '@/src/components/Runs/Summary/constants';
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
  buildTotalMetricEvalDurationQuery,
  buildTotalRunTimeQuery,
  fillUnscoredMetricBars,
  parseComparisonMetricScores,
  parseDurationMs,
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

const EMPTY_STATUS_COUNTS: TestCaseStatusCounts = { passed: 0, failed: 0, error: 0, unscored: 0, total: 0 };

const EMPTY_METRIC_SCORES: MetricScoresData = { overallScore: null, statistics: [], byStatistic: {} };

const EMPTY_MATCHED_ANALYTICS: RunAnalyticsSlice = {
  statusCounts: EMPTY_STATUS_COUNTS,
  totalRunTimeMs: null,
  totalMetricEvalDurationMs: null,
};

const toMatchedAnalyticsSlice = (
  statusCounts: TestCaseStatusCounts,
  totalRunTimeMs: number | null = null,
  totalMetricEvalDurationMs: number | null = null,
): RunAnalyticsSlice => ({
  statusCounts,
  totalRunTimeMs,
  totalMetricEvalDurationMs,
});

const findComparisonRun = (runs: RunComparisonRun[] | undefined, runId: string): RunComparisonRun | undefined =>
  runs?.find((run) => run.runId === runId);

const hasNoMatchedComparisonRows = (runs: RunComparisonRun[] | undefined): boolean =>
  !runs?.length || runs.every((run) => (run.matchedRowCount ?? 0) === 0);

interface ComparisonRunDerived {
  scores: MetricScoresData;
  unmatchedIds: string[];
  unmatchedTestCaseIds: string[];
}

const applyComparisonRun = (run: RunComparisonRun | undefined): ComparisonRunDerived => ({
  scores: parseComparisonMetricScores(run?.scores),
  unmatchedIds: run?.unmatchedEvalSummaryIds ?? [],
  unmatchedTestCaseIds: run?.unmatchedEvalTestCaseIds ?? [],
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
  const [primaryTestSuite, setPrimaryTestSuite] = useState<TestSuite | null>(null);
  const [comparedTestSuite, setComparedTestSuite] = useState<TestSuite | null>(null);
  const [primaryMetricScores, setPrimaryMetricScores] = useState<MetricScoresData | null>(null);
  const [comparedMetricScores, setComparedMetricScores] = useState<MetricScoresData | null>(null);
  const [primaryMetricOptions, setPrimaryMetricOptions] = useState<MetricOption[]>([]);
  const [comparedMetricOptions, setComparedMetricOptions] = useState<MetricOption[]>([]);
  const [primaryMetricCount, setPrimaryMetricCount] = useState<number | undefined>(undefined);
  const [comparedMetricCount, setComparedMetricCount] = useState<number | undefined>(undefined);
  const [metricInfoByName, setMetricInfoByName] = useState<Record<string, MetricInfo>>({});
  const [primaryMatchedAnalytics, setPrimaryMatchedAnalytics] = useState<RunAnalyticsSlice | null>(null);
  const [comparedMatchedAnalytics, setComparedMatchedAnalytics] = useState<RunAnalyticsSlice | null>(null);
  const [primaryUnmatchedIds, setPrimaryUnmatchedIds] = useState<string[]>([]);
  const [comparedUnmatchedIds, setComparedUnmatchedIds] = useState<string[]>([]);
  const [hasNoMatchingTestCases, setHasNoMatchingTestCases] = useState(false);
  const { selectedStatistic } = summaryState;

  const enrichedPrimaryScores = useMemo(
    () =>
      primaryMetricScores
        ? attachMetricInfo(fillUnscoredMetricBars(primaryMetricScores, primaryMetricOptions), metricInfoByName)
        : primaryMetricScores,
    [primaryMetricScores, primaryMetricOptions, metricInfoByName],
  );

  const enrichedComparedScores = useMemo(
    () =>
      comparedMetricScores
        ? attachMetricInfo(fillUnscoredMetricBars(comparedMetricScores, comparedMetricOptions), metricInfoByName)
        : comparedMetricScores,
    [comparedMetricScores, comparedMetricOptions, metricInfoByName],
  );

  const metricOptions = useMemo(
    () => unionMetricOptions(primaryMetricOptions, comparedMetricOptions),
    [primaryMetricOptions, comparedMetricOptions],
  );

  useEffect(() => {
    if (!enrichedPrimaryScores || !enrichedComparedScores) {
      return;
    }

    const statistics = unionStatistics(enrichedPrimaryScores.statistics, enrichedComparedScores.statistics);
    const isStaleOverall = selectedStatistic === OVERALL_METRIC_SCORE_NAME;
    const isMissingSelection = selectedStatistic == null || !statistics.includes(selectedStatistic);
    if (!isStaleOverall && !isMissingSelection) {
      return;
    }

    const defaultStatistic = statistics[0] ?? null;
    if (defaultStatistic) {
      setSummaryState({ selectedStatistic: defaultStatistic });
    }
  }, [enrichedPrimaryScores, enrichedComparedScores, selectedStatistic, setSummaryState]);

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
    // Runs of different test suites can be compared, so each run resolves its own suite.
    const loadSuite = (suiteId: string | undefined, setSuite: (suite: TestSuite | null) => void) => {
      if (!suiteId) {
        setSuite(null);
        return () => {};
      }

      let cancelled = false;
      getTestSuite(suiteId, DEFAULT_ETAG).then((res) => {
        if (!cancelled) {
          setSuite((res?.response as TestSuite | null) ?? null);
        }
      });
      return () => {
        cancelled = true;
      };
    };

    const cancelPrimary = loadSuite(primaryRun?.testSuiteId, setPrimaryTestSuite);
    const cancelCompared = loadSuite(comparedRun?.testSuiteId, setComparedTestSuite);

    return () => {
      cancelPrimary();
      cancelCompared();
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
      setHasNoMatchingTestCases(false);
    };

    const applyEmptyComparison = () => {
      setPrimaryMetricScores(EMPTY_METRIC_SCORES);
      setComparedMetricScores(EMPTY_METRIC_SCORES);
      setPrimaryMatchedAnalytics(EMPTY_MATCHED_ANALYTICS);
      setComparedMatchedAnalytics(EMPTY_MATCHED_ANALYTICS);
      setPrimaryUnmatchedIds([]);
      setComparedUnmatchedIds([]);
      setHasNoMatchingTestCases(true);
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
        if (response == null) {
          applyEmptyComparison();
          if (!notifiedComparisonErrorRef.current) {
            notifiedComparisonErrorRef.current = true;
            showNotificationRef.current(
              getErrorNotification(tRef.current(RunsI18nKey.RunCompareMatchedScoresLoadFailed)),
            );
          }
          return;
        }

        if (hasNoMatchedComparisonRows(response.runs)) {
          applyEmptyComparison();
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

        const loadMatchedAnalytics = async (
          runId: string,
          derived: ComparisonRunDerived,
        ): Promise<RunAnalyticsSlice> => {
          const [statusResult, runTimeResult, metricEvalResult] = await Promise.all([
            executeStructuredQuery(buildTestCasesStatusQuery(runId, derived.unmatchedTestCaseIds)),
            executeStructuredQuery(buildTotalRunTimeQuery(runId, derived.unmatchedIds)),
            executeStructuredQuery(buildTotalMetricEvalDurationQuery(runId, derived.unmatchedIds)),
          ]);
          return toMatchedAnalyticsSlice(
            parseTestCaseStatusCounts(statusResult),
            parseDurationMs(runTimeResult, TOTAL_DURATION_ALIAS),
            parseDurationMs(metricEvalResult, TOTAL_METRIC_EVAL_DURATION_ALIAS),
          );
        };

        const [primaryAnalytics, comparedAnalytics] = await Promise.all([
          loadMatchedAnalytics(primaryRunId, primaryPartial),
          loadMatchedAnalytics(comparedRunId, comparedPartial),
        ]);
        if (cancelled) {
          return;
        }

        setPrimaryMatchedAnalytics(primaryAnalytics);
        setComparedMatchedAnalytics(comparedAnalytics);
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
      setPrimaryMetricCount(undefined);
      setComparedMetricCount(undefined);
      setMetricInfoByName({});
      return;
    }

    let cancelled = false;
    setMetricInfoByName({});
    setPrimaryMetricCount(undefined);
    setComparedMetricCount(undefined);

    Promise.all([getMetricSnapshots(RUN_FILTER(primaryRunId)), getMetricSnapshots(RUN_FILTER(comparedRunId))]).then(
      async ([primarySnapshots, comparedSnapshots]) => {
        if (cancelled) {
          return;
        }
        setPrimaryMetricOptions(toMetricOptions(primarySnapshots));
        setComparedMetricOptions(toMetricOptions(comparedSnapshots));
        setPrimaryMetricCount(primarySnapshots?.length ?? 0);
        setComparedMetricCount(comparedSnapshots?.length ?? 0);

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
    primaryTestSuite,
    comparedTestSuite,
    primaryMetricCount,
    comparedMetricCount,
    enrichedPrimaryScores,
    enrichedComparedScores,
    metricOptions,
    primaryMatchedAnalytics,
    comparedMatchedAnalytics,
    primaryUnmatchedIds,
    comparedUnmatchedIds,
    hasNoMatchingTestCases,
  };
};

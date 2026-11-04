import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { OverallScoreType } from '@/src/models/evaluation/test-suite';
import { useCompareKpiCards } from '../use-compare-kpi-cards';

const executeStructuredQueryMock = vi.fn();
const getRunsTotalCostsMock = vi.fn();
const getPlatformModelMock = vi.fn();
const getEntityModelMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
  getRunsTotalCosts: (ids: string[]) => getRunsTotalCostsMock(ids),
}));
vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getPlatformModelMock(...args),
}));
vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModel: (...args: unknown[]) => getEntityModelMock(...args),
}));

const { Primary, Secondary } = CompareRunSlot;

const status = (above: number, below: number, error: number) => ({
  rows: [
    { execution_status: 'SUCCESS', passed: true, count: above },
    { execution_status: 'SUCCESS', passed: false, count: below },
    { execution_status: 'ERROR', passed: null, count: error },
  ],
});
const STATUS_BY_RUN: Record<string, ReturnType<typeof status>> = {
  'run-1': status(20, 25, 10),
  'run-2': status(18, 24, 13),
};
const RUN_TIME_BY_RUN: Record<string, number> = { 'run-1': 241000, 'run-2': 351000 };
const COSTS_BY_RUN: Record<
  string,
  { runId: string; totalCost: number; testCaseCost: number; metricEvalCost: number }[]
> = {
  'run-1': [{ runId: 'run-1', totalCost: 120, testCaseCost: 100, metricEvalCost: 20 }],
  'run-2': [{ runId: 'run-2', totalCost: 110, testCaseCost: 100, metricEvalCost: 10 }],
};

const buildRun = (id: string, overrides: Partial<Run> = {}): Run => ({
  id,
  status: RunStatus.COMPLETED,
  completedAt: Date.now(),
  suiteSnapshot: {
    overallScoreThreshold: 0.6,
    deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
  },
  ...overrides,
});
const withoutThreshold = (id: string) =>
  buildRun(id, { suiteSnapshot: { deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model } } });

const runIdOf = (query: StructuredQuery): string =>
  JSON.stringify(query.filter).includes('run-2') ? 'run-2' : 'run-1';

const renderKpis = (overrides: Partial<Parameters<typeof useCompareKpiCards>[0]> = {}) =>
  renderHook(() =>
    useCompareKpiCards({
      primaryRun: buildRun('run-1'),
      comparedRun: buildRun('run-2'),
      onlyMatchingTestCases: false,
      primaryMatchedAnalytics: null,
      comparedMatchedAnalytics: null,
      ...overrides,
    }),
  );

describe('useCompareKpiCards', () => {
  beforeEach(() => {
    executeStructuredQueryMock.mockReset();
    getRunsTotalCostsMock.mockReset();
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-4', pricing: { prompt: '0.001' } } });
    getEntityModelMock.mockResolvedValue(null);
    executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
      const runId = runIdOf(query);
      if (query.group_by) {
        return Promise.resolve(STATUS_BY_RUN[runId]);
      }
      const alias = query.select?.[0]?.as;
      return Promise.resolve(
        alias === 'total_duration_ms' ? { rows: [{ total_duration_ms: RUN_TIME_BY_RUN[runId] }] } : { rows: [] },
      );
    });
    getRunsTotalCostsMock.mockImplementation(([id]: string[]) => Promise.resolve(COSTS_BY_RUN[id]));
  });

  test('is null until both runs have loaded', async () => {
    const { result } = renderKpis();

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).not.toBeNull());
  });

  test('keys every per-run value by its slot', async () => {
    const { result } = renderKpis();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.figures[Primary].breakdown.completed).toBe(45);
    expect(result.current?.figures[Secondary].breakdown.completed).toBe(42);
    expect(result.current?.sourceLabels).toEqual({ [Primary]: 'Model', [Secondary]: 'Model' });
  });

  test('measures every diff as the second run minus the baseline', async () => {
    const { result } = renderKpis();

    await waitFor(() => expect(result.current?.costs[Secondary].isPending).toBe(false));
    await waitFor(() => expect(result.current?.costs[Primary].isPending).toBe(false));
    const deltas = result.current?.deltas;
    expect(deltas?.completed).toEqual({ kind: MetricDeltaKind.Changed, value: -3 });
    expect(deltas?.runtime).toEqual({ kind: MetricDeltaKind.Changed, value: 110 });
    expect(deltas?.costLabel).toBe('-$10');
  });

  test('has no cost diff while either cost is still settling', async () => {
    getRunsTotalCostsMock.mockImplementation(([id]: string[]) =>
      id === 'run-2' ? new Promise(() => undefined) : Promise.resolve(COSTS_BY_RUN[id]),
    );

    const { result } = renderKpis();

    await waitFor(() => expect(result.current?.costs[Primary].isPending).toBe(false));
    expect(result.current?.deltas.costLabel).toBeNull();
  });

  test('diffs the overall scores from the baseline and shows the card when either run has one', async () => {
    const { result } = renderKpis({ primaryOverallScore: 0.812, comparedOverallScore: 0.265 });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.deltas.overallScore).toEqual({ kind: MetricDeltaKind.Changed, value: -0.547 });
    expect(result.current?.hasOverallScore).toBe(true);
  });

  test('hides the overall score card when neither run has a score', async () => {
    const { result } = renderKpis({ primaryOverallScore: null, comparedOverallScore: null });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.hasOverallScore).toBe(false);
  });

  test('titles the rate card Threshold Pass Rate when both runs have a threshold', async () => {
    const { result } = renderKpis();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.rateTitleKey).toBe(RunsI18nKey.ThresholdPassRate);
    expect(result.current?.deltas.rate).not.toBeNull();
  });

  test('titles the rate card Completion Rate when neither run has a threshold', async () => {
    const { result } = renderKpis({ primaryRun: withoutThreshold('run-1'), comparedRun: withoutThreshold('run-2') });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.rateTitleKey).toBe(RunsI18nKey.CompletionRate);
  });

  test('dashes the run without a threshold and drops the rate diff when thresholds are mixed', async () => {
    const { result } = renderKpis({ comparedRun: withoutThreshold('run-2') });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.rateTitleKey).toBe(RunsI18nKey.ThresholdPassRate);
    expect(result.current?.rates[Primary]).toBeCloseTo(20 / 55);
    expect(result.current?.rates[Secondary]).toBeNull();
    expect(result.current?.deltas.rate).toBeNull();
  });

  test('flags Error only for a completed run without runtime, and for both only when both lack it', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    getRunsTotalCostsMock.mockResolvedValue([]);

    const { result } = renderKpis({
      primaryRun: buildRun('run-1', { completedAt: 1 }),
      comparedRun: buildRun('run-2', { status: RunStatus.CANCELLED, completedAt: 1 }),
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.hasRuntimeError).toEqual({ [Primary]: true, [Secondary]: false });
    expect(result.current?.hasBothRuntimeErrors).toBe(false);
    expect(result.current?.hasNoTestCases).toBe(true);
  });

  test('uses the supplied matched-only slices without querying, and still fetches whole-run cost', async () => {
    const matched = (passed: number, runTime: number): RunAnalyticsSlice => ({
      statusCounts: { passed, failed: 0, error: 0, unscored: 0, total: passed },
      hasScoreRows: true,
      totalRunTimeMs: runTime,
      totalMetricEvalDurationMs: null,
    });

    const { result } = renderKpis({
      onlyMatchingTestCases: true,
      primaryMatchedAnalytics: matched(30, 100000),
      comparedMatchedAnalytics: matched(25, 80000),
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
    expect(result.current?.deltas.completed).toEqual({ kind: MetricDeltaKind.Changed, value: -5 });
    expect(result.current?.deltas.runtime).toEqual({ kind: MetricDeltaKind.Changed, value: -20 });
    await waitFor(() => expect(result.current?.costs[Primary].totalCost).toBe(120));
  });

  describe('for runs without score rows', () => {
    const execution = (testCaseId: string, status: string) => ({
      test_case_id: testCaseId,
      execution_status: status,
      count: 1,
    });

    const mockNoMetricsQueries = (executionsByRun: Record<string, unknown[]>) => {
      executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
        const runId = runIdOf(query);
        if (query.entity === 'test_case_eval_scores') {
          return Promise.resolve({ rows: [] });
        }
        if (query.group_by) {
          return Promise.resolve({ rows: executionsByRun[runId] ?? [] });
        }
        return Promise.resolve({ rows: [{ total_duration_ms: RUN_TIME_BY_RUN[runId] }] });
      });
    };

    test("uses each finished run's reported total and counts completion from its executions", async () => {
      mockNoMetricsQueries({
        'run-1': [execution('a', 'SUCCESS'), execution('b', 'SUCCESS')],
        'run-2': [execution('a', 'SUCCESS')],
      });

      const { result } = renderKpis({
        primaryRun: buildRun('run-1', { numberOfTestCases: 2 }),
        comparedRun: buildRun('run-2', { numberOfTestCases: 2 }),
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current?.figures[Primary].breakdown).toEqual({
        total: 2,
        completed: 2,
        above: 0,
        below: 0,
        errorOrNa: 0,
      });
      expect(result.current?.figures[Secondary].breakdown).toEqual({
        total: 2,
        completed: 1,
        above: 0,
        below: 0,
        errorOrNa: 1,
      });
      expect(result.current?.deltas.completed).toEqual({ kind: MetricDeltaKind.Changed, value: -1 });
    });

    test('titles the rate card Completion Rate when neither run has scores to apply a threshold to', async () => {
      mockNoMetricsQueries({ 'run-1': [execution('a', 'SUCCESS')], 'run-2': [execution('a', 'SUCCESS')] });

      const { result } = renderKpis({
        primaryRun: buildRun('run-1', { numberOfTestCases: 1 }),
        comparedRun: buildRun('run-2', { numberOfTestCases: 1 }),
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current?.rateTitleKey).toBe(RunsI18nKey.CompletionRate);
      expect(result.current?.figures[Primary].hasThreshold).toBe(false);
    });

    test('does not apply the threshold to a matched-only slice derived from executions', async () => {
      const derived: RunAnalyticsSlice = {
        statusCounts: { passed: 0, failed: 0, error: 1, unscored: 3, total: 4 },
        hasScoreRows: false,
        totalRunTimeMs: 1000,
        totalMetricEvalDurationMs: null,
      };

      const { result } = renderKpis({
        onlyMatchingTestCases: true,
        primaryMatchedAnalytics: derived,
        comparedMatchedAnalytics: derived,
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current?.figures[Primary].hasThreshold).toBe(false);
      expect(result.current?.rateTitleKey).toBe(RunsI18nKey.CompletionRate);
    });
  });

  describe('the overall-score methods', () => {
    const withMethod = (id: string, overallScore?: object) =>
      buildRun(id, {
        suiteSnapshot: {
          overallScoreThreshold: 0.6,
          deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
          ...(overallScore ? { overallScore } : {}),
        } as Run['suiteSnapshot'],
      });

    test("are each run's own stored method", async () => {
      const weighted = {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'deepeval.context_prec', outputField: 'score', weight: 0.3 }],
      };

      const { result } = renderKpis({
        primaryRun: withMethod('run-1', { type: OverallScoreType.Mean }),
        comparedRun: withMethod('run-2', weighted),
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current?.scoreMethods).toEqual({
        [Primary]: { type: OverallScoreType.Mean },
        [Secondary]: weighted,
      });
    });

    test('default to the mean for a run whose snapshot stores no method', async () => {
      const { result } = renderKpis({ primaryRun: withMethod('run-1'), comparedRun: withMethod('run-2') });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current?.scoreMethods[Secondary]).toEqual({ type: OverallScoreType.Mean });
    });

    test('are null for a run without a snapshot, without affecting the other run', async () => {
      const { result } = renderKpis({
        primaryRun: withMethod('run-1', { type: OverallScoreType.Mean }),
        comparedRun: buildRun('run-2', { suiteSnapshot: undefined }),
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current?.scoreMethods[Primary]).toEqual({ type: OverallScoreType.Mean });
      expect(result.current?.scoreMethods[Secondary]).toBeNull();
    });
  });
});

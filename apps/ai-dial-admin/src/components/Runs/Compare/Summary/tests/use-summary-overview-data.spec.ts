import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSummaryOverviewData } from '../use-summary-overview-data';

const getRunMock = vi.fn();
const getMetricScoresComparisonMock = vi.fn();
const executeStructuredQueryMock = vi.fn();
const getMetricSnapshotsMock = vi.fn();
const getTestSuiteMock = vi.fn();
const getMetricLatestVersionMock = vi.fn();
const showNotificationMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (...args: unknown[]) => getRunMock(...args),
  getMetricScoresComparison: (...args: unknown[]) => getMetricScoresComparisonMock(...args),
  executeStructuredQuery: (...args: unknown[]) => executeStructuredQueryMock(...args),
  getMetricSnapshots: (...args: unknown[]) => getMetricSnapshotsMock(...args),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuite: (...args: unknown[]) => getTestSuiteMock(...args),
  getMetricLatestVersion: (...args: unknown[]) => getMetricLatestVersionMock(...args),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock, removeNotification: vi.fn() }),
}));

const ZERO_MATCHED_RUN = {
  computationId: 'c1',
  totalRowCount: 10,
  matchedRowCount: 0,
  unmatchedEvalSummaryIds: ['eval-1'],
  unmatchedEvalTestCaseIds: ['case-1'],
  scores: [],
};

const renderOverviewData = (onlyMatchingTestCases = true) =>
  renderHook(() =>
    useSummaryOverviewData({
      primaryRunId: 'run-1',
      comparedRunId: 'run-2',
      onlyMatchingTestCases,
      summaryState: { selectedStatistic: null, selectedDistributionMetricName: null },
      setSummaryState: vi.fn(),
    }),
  );

describe('useSummaryOverviewData', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getMetricScoresComparisonMock.mockReset();
    executeStructuredQueryMock.mockReset();
    getMetricSnapshotsMock.mockReset();
    getTestSuiteMock.mockReset();
    getMetricLatestVersionMock.mockReset();
    showNotificationMock.mockReset();

    getRunMock.mockImplementation((id: string) => Promise.resolve({ id, testSuiteId: 'suite-1' }));
    getMetricSnapshotsMock.mockResolvedValue([]);
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'Suite' } });
    getMetricLatestVersionMock.mockResolvedValue(null);
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
  });

  test('resolves the test suite of each run when the runs belong to different suites', async () => {
    getMetricScoresComparisonMock.mockResolvedValue({ runs: [] });
    getRunMock.mockImplementation((id: string) =>
      Promise.resolve({ id, testSuiteId: id === 'run-1' ? 'suite-1' : 'suite-2' }),
    );
    getTestSuiteMock.mockImplementation((id: string) => Promise.resolve({ response: { id, name: `Name ${id}` } }));

    const { result } = renderOverviewData();

    await waitFor(() => expect(result.current.comparedTestSuite?.name).toBe('Name suite-2'));
    expect(result.current.primaryTestSuite?.name).toBe('Name suite-1');
  });

  test('treats an empty comparison payload as no matching test cases without toasting', async () => {
    getMetricScoresComparisonMock.mockResolvedValue({ runs: [] });

    const { result } = renderOverviewData();

    await waitFor(() => expect(result.current.hasNoMatchingTestCases).toBe(true));
    expect(showNotificationMock).not.toHaveBeenCalled();
    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });

  test('treats zero matched rows as no matching test cases without toasting', async () => {
    getMetricScoresComparisonMock.mockResolvedValue({
      runs: [
        { ...ZERO_MATCHED_RUN, runId: 'run-1' },
        { ...ZERO_MATCHED_RUN, runId: 'run-2', computationId: 'c2' },
      ],
    });

    const { result } = renderOverviewData();

    await waitFor(() => expect(result.current.hasNoMatchingTestCases).toBe(true));
    expect(showNotificationMock).not.toHaveBeenCalled();
    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });

  test('toasts when the matched-scores request fails', async () => {
    getMetricScoresComparisonMock.mockResolvedValue(null);

    const { result } = renderOverviewData();

    await waitFor(() => expect(result.current.hasNoMatchingTestCases).toBe(true));
    expect(showNotificationMock).toHaveBeenCalledOnce();
  });

  test('excludes unmatched test cases from status counts and unmatched eval summaries from duration', async () => {
    const MATCHED_RUN = {
      computationId: 'c1',
      totalRowCount: 10,
      matchedRowCount: 8,
      unmatchedEvalSummaryIds: ['eval-1', 'eval-2'],
      unmatchedEvalTestCaseIds: ['case-1', 'case-2'],
      scores: [],
    };
    getMetricScoresComparisonMock.mockResolvedValue({
      runs: [
        { ...MATCHED_RUN, runId: 'run-1' },
        { ...MATCHED_RUN, runId: 'run-2', computationId: 'c2' },
      ],
    });

    renderOverviewData();

    await vi.waitFor(() => expect(executeStructuredQueryMock).toHaveBeenCalledTimes(6));

    // NOT (field IN [...]) shape: and([runFilter, not(in(field, values))]).
    const exclusionField = (query: { filter: { args: unknown[] } }) => {
      const notNode = query.filter.args[1] as { args: [{ args: [{ name: string }, { items: { value: string }[] }] }] };
      const inNode = notNode.args[0];
      return { field: inNode.args[0].name, values: inNode.args[1].items.map((item) => item.value) };
    };

    const queries = executeStructuredQueryMock.mock.calls.map(([query]) => query);
    const statusQueries = queries.filter((query) => query.entity === 'test_case_eval_scores');
    const durationQueries = queries.filter((query) => query.entity === 'eval_summaries');

    expect(statusQueries).toHaveLength(2);
    // Source runtime and metric-eval runtime, once per run.
    expect(durationQueries).toHaveLength(4);
    statusQueries.forEach((query) => {
      expect(exclusionField(query)).toEqual({ field: 'test_case_id', values: ['case-1', 'case-2'] });
    });
    durationQueries.forEach((query) => {
      expect(exclusionField(query)).toEqual({ field: 'id', values: ['eval-1', 'eval-2'] });
    });
  });

  test('sums matched-only runtimes and keeps the status split for each run', async () => {
    const MATCHED_RUN = {
      computationId: 'c1',
      totalRowCount: 10,
      matchedRowCount: 8,
      unmatchedEvalSummaryIds: ['eval-1'],
      unmatchedEvalTestCaseIds: ['case-1'],
      scores: [],
    };
    getMetricScoresComparisonMock.mockResolvedValue({
      runs: [
        { ...MATCHED_RUN, runId: 'run-1' },
        { ...MATCHED_RUN, runId: 'run-2', computationId: 'c2' },
      ],
    });
    executeStructuredQueryMock.mockImplementation((query: { select?: { as?: string }[]; group_by?: unknown }) => {
      const alias = query.select?.[0]?.as;
      if (query.group_by) {
        return Promise.resolve({ rows: [{ execution_status: 'SUCCESS', passed: true, count: 7 }] });
      }
      if (alias === 'total_duration_ms') {
        return Promise.resolve({ rows: [{ total_duration_ms: 341000 }] });
      }
      if (alias === 'total_metric_eval_duration_ms') {
        return Promise.resolve({ rows: [{ total_metric_eval_duration_ms: 291000 }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const { result } = renderOverviewData();

    await waitFor(() => expect(result.current.primaryMatchedAnalytics).not.toBeNull());
    await waitFor(() => expect(result.current.comparedMatchedAnalytics).not.toBeNull());
    expect(result.current.primaryMatchedAnalytics).toEqual({
      statusCounts: { passed: 7, failed: 0, error: 0, unscored: 0, total: 7 },
      totalRunTimeMs: 341000,
      totalMetricEvalDurationMs: 291000,
    });
  });

  test('exposes how many metrics each run computed once the snapshots load', async () => {
    getMetricSnapshotsMock.mockImplementation((filters: { value?: string }[] | undefined) =>
      Promise.resolve(JSON.stringify(filters).includes('run-1') ? [{ tsmdName: 'a' }, { tsmdName: 'b' }] : []),
    );

    const { result } = renderOverviewData(false);

    expect(result.current.primaryMetricCount).toBeUndefined();
    await waitFor(() => expect(result.current.primaryMetricCount).toBe(2));
    expect(result.current.comparedMetricCount).toBe(0);
  });
});

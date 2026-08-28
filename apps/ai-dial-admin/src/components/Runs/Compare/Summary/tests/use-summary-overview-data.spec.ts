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
});

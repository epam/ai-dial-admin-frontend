import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { executeStructuredQuery, getTestCasePassRate } from '@/src/app/[lang]/runs/actions';
import { getRuns } from '@/src/app/[lang]/test-suites/actions';
import { useTrendsData } from '@/src/components/TestSuites/Trends/use-trends-data';
import { CasePassRateResponse } from '@/src/models/evaluation/case-pass-rate';
import { RunStatus } from '@/src/models/evaluation/run';

vi.mock('@/src/app/[lang]/runs/actions');
vi.mock('@/src/app/[lang]/test-suites/actions');

const RUNS_PAGE = {
  content: [{ id: 'run-1', testRunName: 'nightly-1', status: RunStatus.COMPLETED, startedAt: 10, completedAt: 20 }],
};

const PASS_RATE: CasePassRateResponse = {
  testSuiteId: 'suite-1',
  runs: [
    {
      testSuiteRunId: 'run-1',
      failedCount: 1,
      successPassedCount: 25,
      successNotPassedCount: 3,
      successNoVerdictCount: 0,
      totalCount: 29,
    },
  ],
};

describe('useTrendsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(executeStructuredQuery).mockResolvedValue(null);
    vi.mocked(getRuns).mockResolvedValue(RUNS_PAGE as never);
  });

  test('requests the case-pass-rate window and exposes the built bars', async () => {
    vi.mocked(getTestCasePassRate).mockResolvedValue(PASS_RATE);

    const { result } = renderHook(() => useTrendsData('suite-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getTestCasePassRate).toHaveBeenCalledWith('suite-1', 10);
    expect(result.current.data?.casePassRate).toHaveLength(1);
    expect(result.current.data?.casePassRate?.[0]).toMatchObject({
      runId: 'run-1',
      label: 'nightly-1',
      passedCount: 25,
      href: '/runs/nightly-1?id=run-1',
    });
  });

  test('exposes an empty bar list when the suite has no runs in the window', async () => {
    vi.mocked(getTestCasePassRate).mockResolvedValue({ testSuiteId: 'suite-1', runs: [] });

    const { result } = renderHook(() => useTrendsData('suite-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.casePassRate).toEqual([]);
  });

  test('keeps the rest of the tab populated when the case-pass-rate request rejects', async () => {
    vi.mocked(getTestCasePassRate).mockRejectedValue(new Error('404'));

    const { result } = renderHook(() => useTrendsData('suite-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.casePassRate).toBeNull();
    expect(result.current.data?.runOrder).toHaveLength(1);
    expect(result.current.data?.kpis.runCount).toBe(1);
  });

  test('keeps the rest of the tab populated when the case-pass-rate body is malformed', async () => {
    // Regression: building the bars outside the failure boundary dropped the whole tab into its
    // empty state, so Trends rendered "No runs yet" for a suite that had runs.
    vi.mocked(getTestCasePassRate).mockResolvedValue('Not Found' as never);

    const { result } = renderHook(() => useTrendsData('suite-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.casePassRate).toBeNull();
    expect(result.current.data?.runOrder).toHaveLength(1);
    expect(result.current.data?.kpis.runCount).toBe(1);
  });

  test('treats a null case-pass-rate response as unavailable', async () => {
    vi.mocked(getTestCasePassRate).mockResolvedValue(null);

    const { result } = renderHook(() => useTrendsData('suite-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.casePassRate).toBeNull();
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { getRunTrends } from '@/src/app/[lang]/runs/actions';
import { CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useRunTrendsData } from '@/src/components/EvalSystemHealth/use-run-trends-data';
import { SuiteRunTrend, SuiteType } from '@/src/models/evaluation/run-trend';
import { EvaluationPageData } from '@/src/models/request';

vi.mock('@/src/app/[lang]/runs/actions', () => ({ getRunTrends: vi.fn() }));

const suiteOf = (suiteId: string): SuiteRunTrend => ({
  suiteId,
  suiteName: `Suite ${suiteId}`,
  suiteType: SuiteType.Deployment,
  evaluatee: {},
  runs: [],
});

const pageOf = (
  page: number,
  suiteIds: string[],
  overrides: Partial<EvaluationPageData<SuiteRunTrend>> = {},
): EvaluationPageData<SuiteRunTrend> => ({
  page,
  size: 10,
  totalElements: 25,
  totalPages: 3,
  content: suiteIds.map(suiteOf),
  ...overrides,
});

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const suiteIdsOf = (rows: { suiteId: string }[]) => rows.map((row) => row.suiteId);

describe('useRunTrendsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('starts loading the first page with no rows', () => {
    vi.mocked(getRunTrends).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRunTrendsData());

    expect(result.current.status).toBe(CoverageStatus.Loading);
    expect(result.current.rows).toEqual([]);
    expect(getRunTrends).toHaveBeenCalledOnce();
    expect(getRunTrends).toHaveBeenCalledWith(0, 10);
  });

  test('returns the rows and the reported totals once the page loads', async () => {
    vi.mocked(getRunTrends).mockResolvedValue(pageOf(0, ['a', 'b']));

    const { result } = renderHook(() => useRunTrendsData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(suiteIdsOf(result.current.rows)).toEqual(['a', 'b']);
    expect(result.current).toMatchObject({ page: 0, totalPages: 3, totalElements: 25 });
  });

  test('reports an empty result as ready with no rows', async () => {
    vi.mocked(getRunTrends).mockResolvedValue(pageOf(0, [], { totalElements: 0, totalPages: 0 }));

    const { result } = renderHook(() => useRunTrendsData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(result.current).toMatchObject({ rows: [], totalElements: 0, totalPages: 0 });
  });

  test('requests the next page and clears the rows while it loads', async () => {
    vi.mocked(getRunTrends).mockResolvedValueOnce(pageOf(0, ['a']));
    const { result } = renderHook(() => useRunTrendsData());
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));

    const next = deferred<EvaluationPageData<SuiteRunTrend>>();
    vi.mocked(getRunTrends).mockReturnValueOnce(next.promise);
    act(() => result.current.goToNextPage());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Loading));
    expect(result.current.rows).toEqual([]);
    expect(result.current.page).toBe(1);
    expect(getRunTrends).toHaveBeenLastCalledWith(1, 10);

    await act(async () => next.resolve(pageOf(1, ['b'])));

    expect(suiteIdsOf(result.current.rows)).toEqual(['b']);
  });

  test('goes back to the previous page but not before the first', async () => {
    vi.mocked(getRunTrends).mockImplementation(async (page) => pageOf(page, [`p${page}`]));
    const { result } = renderHook(() => useRunTrendsData());
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));

    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.rows[0]?.suiteId).toBe('p1'));
    act(() => result.current.goToPreviousPage());
    await waitFor(() => expect(result.current.rows[0]?.suiteId).toBe('p0'));
    act(() => result.current.goToPreviousPage());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(result.current.page).toBe(0);
  });

  test('drops the response of a page the user has already left', async () => {
    const first = deferred<EvaluationPageData<SuiteRunTrend>>();
    const second = deferred<EvaluationPageData<SuiteRunTrend>>();
    vi.mocked(getRunTrends).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useRunTrendsData());

    act(() => result.current.goToNextPage());
    await act(async () => second.resolve(pageOf(1, ['second'])));
    await act(async () => first.resolve(pageOf(0, ['first'])));

    expect(suiteIdsOf(result.current.rows)).toEqual(['second']);
    expect(result.current.page).toBe(1);
  });

  test('errors when the request returns null', async () => {
    vi.mocked(getRunTrends).mockResolvedValue(null);

    const { result } = renderHook(() => useRunTrendsData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));
    expect(result.current.rows).toEqual([]);
  });

  test('errors when the request throws', async () => {
    vi.mocked(getRunTrends).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useRunTrendsData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));
  });

  test('requests the same page again on retry', async () => {
    vi.mocked(getRunTrends).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useRunTrendsData());
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));

    vi.mocked(getRunTrends).mockResolvedValueOnce(pageOf(0, ['a']));
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(getRunTrends).toHaveBeenCalledTimes(2);
    expect(getRunTrends).toHaveBeenLastCalledWith(0, 10);
    expect(suiteIdsOf(result.current.rows)).toEqual(['a']);
  });

  test('steps back to the last page when the backend reports fewer pages than the current index', async () => {
    vi.mocked(getRunTrends).mockImplementation(async (page) =>
      page === 0
        ? pageOf(0, ['a'], { totalPages: 2, totalElements: 15 })
        : pageOf(page, [], { totalPages: 2, totalElements: 15 }),
    );
    const { result } = renderHook(() => useRunTrendsData());
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));

    act(() => result.current.goToNextPage());
    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    act(() => result.current.goToNextPage());

    await waitFor(() => expect(result.current.page).toBe(1));
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(getRunTrends).toHaveBeenCalledWith(2, 10);
  });
});

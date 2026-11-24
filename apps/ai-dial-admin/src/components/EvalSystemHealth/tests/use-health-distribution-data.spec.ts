import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { getHealthDistribution } from '@/src/app/[lang]/runs/actions';
import { CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useHealthDistributionData } from '@/src/components/EvalSystemHealth/use-health-distribution-data';
import { HealthDistribution } from '@/src/models/evaluation/health-distribution';

vi.mock('@/src/app/[lang]/runs/actions', () => ({ getHealthDistribution: vi.fn() }));

const WEEK_MS = 604_800_000;
const FIRST_WEEK = Date.UTC(2025, 9, 6);

const distributionOf = (counts: [number, number][], threshold = 0.75): HealthDistribution => ({
  threshold,
  weeks: counts.map(([healthyCount, failingCount], index) => ({
    weekStart: FIRST_WEEK + index * WEEK_MS,
    healthyCount,
    failingCount,
    suiteCount: healthyCount + failingCount,
  })),
});

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('useHealthDistributionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('starts loading with no bars and asks for five weeks at the default threshold', () => {
    vi.mocked(getHealthDistribution).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useHealthDistributionData());

    expect(result.current.status).toBe(CoverageStatus.Loading);
    expect(result.current.bars).toEqual([]);
    expect(result.current.isEmpty).toBe(false);
    expect(getHealthDistribution).toHaveBeenCalledOnce();
    expect(getHealthDistribution).toHaveBeenCalledWith(5, 0.75);
  });

  test('returns a bar per week in the response order and the reported threshold once loaded', async () => {
    vi.mocked(getHealthDistribution).mockResolvedValue(
      distributionOf(
        [
          [3, 1],
          [0, 0],
          [2, 2],
        ],
        0.8,
      ),
    );

    const { result } = renderHook(() => useHealthDistributionData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(result.current.bars.map((bar) => bar.suiteCount)).toEqual([4, 0, 4]);
    expect(result.current.bars[0].healthyShare).toBe(75);
    expect(result.current.threshold).toBe(0.8);
    expect(result.current.isEmpty).toBe(false);
  });

  test('reports weeks that all have no suite as empty', async () => {
    vi.mocked(getHealthDistribution).mockResolvedValue(
      distributionOf([
        [0, 0],
        [0, 0],
      ]),
    );

    const { result } = renderHook(() => useHealthDistributionData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(result.current.isEmpty).toBe(true);
  });

  test('reports a null result as an error with no bars', async () => {
    vi.mocked(getHealthDistribution).mockResolvedValue(null);

    const { result } = renderHook(() => useHealthDistributionData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));
    expect(result.current.bars).toEqual([]);
    expect(result.current.isEmpty).toBe(false);
  });

  test('reports a throwing request as an error', async () => {
    vi.mocked(getHealthDistribution).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useHealthDistributionData());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));
  });

  test('requests again on retry and shows loading until the response returns', async () => {
    vi.mocked(getHealthDistribution).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useHealthDistributionData());
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Error));

    const second = deferred<HealthDistribution | null>();
    vi.mocked(getHealthDistribution).mockReturnValueOnce(second.promise);
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Loading));
    expect(getHealthDistribution).toHaveBeenCalledTimes(2);

    await act(async () => second.resolve(distributionOf([[1, 1]])));
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    expect(result.current.bars).toHaveLength(1);
  });

  test('drops a response that a retry has superseded', async () => {
    const first = deferred<HealthDistribution | null>();
    const second = deferred<HealthDistribution | null>();
    vi.mocked(getHealthDistribution).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useHealthDistributionData());
    act(() => result.current.retry());

    await act(async () => second.resolve(distributionOf([[2, 0]])));
    await waitFor(() => expect(result.current.status).toBe(CoverageStatus.Ready));
    await act(async () => first.resolve(distributionOf([[0, 9]])));

    expect(result.current.bars).toHaveLength(1);
    expect(result.current.bars[0].healthyCount).toBe(2);
  });
});

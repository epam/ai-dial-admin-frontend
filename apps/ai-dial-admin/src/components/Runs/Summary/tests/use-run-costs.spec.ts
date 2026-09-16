import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { COST_FETCH_TIMEOUT_MS } from '../constants';
import { useRunCosts } from '../use-run-costs';

const getRunCostsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunCosts: (id: string) => getRunCostsMock(id),
}));

describe('useRunCosts', () => {
  beforeEach(() => {
    getRunCostsMock.mockReset();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns costs on success', async () => {
    const payload = { avgTestCaseCost: 0.1, avgMetricEvalCost: 0.2 };
    getRunCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.costs).toEqual(payload);
    expect(result.current.unavailable).toBe(false);
  });

  test('marks unavailable when the action returns null', async () => {
    getRunCostsMock.mockResolvedValue(null);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('marks unavailable when the action throws', async () => {
    getRunCostsMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('clears state when runId is undefined', async () => {
    const { result } = renderHook(() => useRunCosts(undefined));

    expect(result.current.costs).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.unavailable).toBe(false);
    expect(result.current.elapsedMs).toBe(0);
    expect(getRunCostsMock).not.toHaveBeenCalled();
  });

  test('ticks elapsedMs while the fetch is pending', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRunCosts('run-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.elapsedMs).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(15_000);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.unavailable).toBe(false);
  });

  test('marks unavailable after the three-minute soft timeout without aborting the fetch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_TIMEOUT_MS);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.unavailable).toBe(true);
    expect(result.current.costs).toBeNull();
    expect(getRunCostsMock).toHaveBeenCalledTimes(1);
  });

  test('applies a late success after the soft timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let resolveCosts: (value: { avgTestCaseCost: number; avgMetricEvalCost: number }) => void = () => undefined;
    getRunCostsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCosts = resolve;
      }),
    );

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_TIMEOUT_MS);
    });
    expect(result.current.unavailable).toBe(true);

    await act(async () => {
      resolveCosts({ avgTestCaseCost: 0.4, avgMetricEvalCost: 0.2 });
    });

    await waitFor(() => expect(result.current.unavailable).toBe(false));
    expect(result.current.costs).toEqual({ avgTestCaseCost: 0.4, avgMetricEvalCost: 0.2 });
    expect(result.current.isLoading).toBe(false);
  });
});

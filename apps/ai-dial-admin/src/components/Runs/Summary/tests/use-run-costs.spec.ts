import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { COST_FETCH_POLL_INTERVAL_MS } from '../constants';
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

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payload);
    expect(result.current.unavailable).toBe(false);
  });

  test('settles on a payload where only one average is present', async () => {
    const payload = { avgTestCaseCost: null, avgMetricEvalCost: 0.2 };
    getRunCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payload);
    expect(result.current.unavailable).toBe(false);
  });

  test('settles on a zero average rather than treating it as missing', async () => {
    const payload = { avgTestCaseCost: 0, avgMetricEvalCost: 0 };
    getRunCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payload);
    expect(result.current.unavailable).toBe(false);
  });

  test('marks unavailable when the action returns null', async () => {
    getRunCostsMock.mockResolvedValue(null);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('marks unavailable when the action throws', async () => {
    getRunCostsMock.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('clears state when runId is undefined', async () => {
    const { result } = renderHook(() => useRunCosts(undefined));

    expect(result.current.costs).toBeNull();
    expect(result.current.isPending).toBe(false);
    expect(result.current.unavailable).toBe(false);
    expect(result.current.elapsedMs).toBe(0);
    expect(getRunCostsMock).not.toHaveBeenCalled();
  });

  test('does not fetch at all when the caller says the run can have no costs', async () => {
    const { result } = renderHook(() => useRunCosts('run-1', false));

    expect(result.current.isPending).toBe(false);
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(false);
    expect(getRunCostsMock).not.toHaveBeenCalled();
  });

  test('starts fetching once the caller decides costs are possible after all', async () => {
    const payload = { avgTestCaseCost: 0.1, avgMetricEvalCost: 0.2 };
    getRunCostsMock.mockResolvedValue(payload);

    const { result, rerender } = renderHook(({ canHaveCosts }) => useRunCosts('run-1', canHaveCosts), {
      initialProps: { canHaveCosts: false },
    });

    expect(getRunCostsMock).not.toHaveBeenCalled();

    rerender({ canHaveCosts: true });

    await waitFor(() => expect(result.current.costs).toEqual(payload));
    expect(result.current.isPending).toBe(false);
  });

  test('ticks elapsedMs while the fetch is pending', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRunCosts('run-1'));

    expect(result.current.isPending).toBe(true);
    expect(result.current.elapsedMs).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(15_000);
    expect(result.current.isPending).toBe(true);
    expect(result.current.unavailable).toBe(false);
  });

  describe('payload without figures means the backend has not aggregated yet', () => {
    test.each([
      ['all-null averages', { avgTestCaseCost: null, avgMetricEvalCost: null }],
      ['an empty object', {}],
      ['an empty body degraded to a string', ''],
    ])('stays pending and retries on %s', async (_label, notReady) => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      getRunCostsMock.mockResolvedValue(notReady);

      const { result } = renderHook(() => useRunCosts('run-1'));

      await waitFor(() => expect(getRunCostsMock).toHaveBeenCalledTimes(1));
      expect(result.current.isPending).toBe(true);
      expect(result.current.costs).toBeNull();
      expect(result.current.unavailable).toBe(false);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
      });

      expect(getRunCostsMock).toHaveBeenCalledTimes(2);
      expect(result.current.isPending).toBe(true);
      expect(result.current.unavailable).toBe(false);
    });
  });

  test('settles once a retry finally returns figures', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const payload = { avgTestCaseCost: 0.3, avgMetricEvalCost: null };
    getRunCostsMock
      .mockResolvedValueOnce({ avgTestCaseCost: null, avgMetricEvalCost: null })
      .mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(getRunCostsMock).toHaveBeenCalledTimes(1));
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payload);
    expect(result.current.unavailable).toBe(false);
  });

  test('keeps polling well past any former deadline instead of giving up', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunCostsMock.mockResolvedValue({ avgTestCaseCost: null, avgMetricEvalCost: null });

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 100);
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.unavailable).toBe(false);
    expect(result.current.costs).toBeNull();
    expect(getRunCostsMock.mock.calls.length).toBeGreaterThan(50);
  });

  test('settles on an endpoint error raised by a later attempt', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunCostsMock
      .mockResolvedValueOnce({ avgTestCaseCost: null, avgMetricEvalCost: null })
      .mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(getRunCostsMock).toHaveBeenCalledTimes(1));
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
    });

    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(result.current.costs).toBeNull();
  });

  test('stops polling once the hook unmounts', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunCostsMock.mockResolvedValue({ avgTestCaseCost: null, avgMetricEvalCost: null });

    const { unmount } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(getRunCostsMock).toHaveBeenCalledTimes(1));
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 5);
    });

    expect(getRunCostsMock).toHaveBeenCalledTimes(1);
  });
});

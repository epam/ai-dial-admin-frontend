import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { COST_FETCH_MAX_WAIT_MS, COST_FETCH_POLL_INTERVAL_MS } from '../constants';
import { useRunCosts } from '../use-run-costs';

const getRunsTotalCostsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunsTotalCosts: (ids: string[]) => getRunsTotalCostsMock(ids),
}));

/** The run totals endpoint answers with one entry per requested run id. */
const totals = (testCaseCost: number | null, metricEvalCost: number | null) => [
  { runId: 'run-1', totalCost: (testCaseCost ?? 0) + (metricEvalCost ?? 0), testCaseCost, metricEvalCost },
];
const figures = (sourceCost: number | null, metricsCost: number | null) => ({ sourceCost, metricsCost });

describe('useRunCosts', () => {
  beforeEach(() => {
    getRunsTotalCostsMock.mockReset();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns costs on success', async () => {
    const payload = totals(0.1, 0.2);
    const payloadFigures = figures(0.1, 0.2);
    getRunsTotalCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payloadFigures);
    expect(result.current.unavailable).toBe(false);
  });

  test('settles on a payload where only one cost is present', async () => {
    const payload = totals(null, 0.2);
    const payloadFigures = figures(null, 0.2);
    getRunsTotalCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payloadFigures);
    expect(result.current.unavailable).toBe(false);
  });

  test('settles on a zero cost rather than treating it as missing', async () => {
    const payload = totals(0, 0);
    const payloadFigures = figures(0, 0);
    getRunsTotalCostsMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payloadFigures);
    expect(result.current.unavailable).toBe(false);
  });

  test('marks unavailable when the action returns null', async () => {
    getRunsTotalCostsMock.mockResolvedValue(null);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(true);
  });

  test('marks unavailable when the action throws', async () => {
    getRunsTotalCostsMock.mockRejectedValue(new Error('network'));

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
    expect(getRunsTotalCostsMock).not.toHaveBeenCalled();
  });

  test('does not fetch at all when the caller says the run can have no costs', async () => {
    const { result } = renderHook(() => useRunCosts('run-1', false));

    expect(result.current.isPending).toBe(false);
    expect(result.current.costs).toBeNull();
    expect(result.current.unavailable).toBe(false);
    expect(getRunsTotalCostsMock).not.toHaveBeenCalled();
  });

  test('starts fetching once the caller decides costs are possible after all', async () => {
    const payload = totals(0.1, 0.2);
    const payloadFigures = figures(0.1, 0.2);
    getRunsTotalCostsMock.mockResolvedValue(payload);

    const { result, rerender } = renderHook(({ canHaveCosts }) => useRunCosts('run-1', canHaveCosts), {
      initialProps: { canHaveCosts: false },
    });

    expect(getRunsTotalCostsMock).not.toHaveBeenCalled();

    rerender({ canHaveCosts: true });

    await waitFor(() => expect(result.current.costs).toEqual(payloadFigures));
    expect(result.current.isPending).toBe(false);
  });

  test('stays pending without settling while the fetch is outstanding', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunsTotalCostsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useRunCosts('run-1'));

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.unavailable).toBe(false);
  });

  describe('payload without figures means the backend has not aggregated yet', () => {
    test.each([
      ['an entry with null costs', totals(null, null)],
      ['an empty list', []],
      ['an empty object', {}],
      ['an empty body degraded to a string', ''],
    ])('stays pending and retries on %s', async (_label, notReady) => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      getRunsTotalCostsMock.mockResolvedValue(notReady);

      const { result } = renderHook(() => useRunCosts('run-1'));

      await act(async () => {});
      expect(getRunsTotalCostsMock).toHaveBeenCalledOnce();
      expect(getRunsTotalCostsMock).toHaveBeenCalledWith(['run-1']);
      expect(result.current.isPending).toBe(true);
      expect(result.current.costs).toBeNull();
      expect(result.current.unavailable).toBe(false);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
      });

      expect(getRunsTotalCostsMock).toHaveBeenCalledTimes(2);
      expect(result.current.isPending).toBe(true);
      expect(result.current.unavailable).toBe(false);
    });
  });

  test('reads once and settles on a figureless payload when told not to poll', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const empty = totals(null, null);
    const emptyFigures = figures(null, null);
    getRunsTotalCostsMock.mockResolvedValue(empty);

    const { result } = renderHook(() => useRunCosts('run-1', true, false));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(emptyFigures);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 5);
    });
    expect(getRunsTotalCostsMock).toHaveBeenCalledTimes(1);
  });

  test('still returns a real figure when told not to poll', async () => {
    getRunsTotalCostsMock.mockResolvedValue(totals(0.5, 0.25));

    const { result } = renderHook(() => useRunCosts('run-1', true, false));

    await waitFor(() => expect(result.current.costs).toEqual(figures(0.5, 0.25)));
  });

  test('settles once a retry finally returns figures', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const payload = totals(0.3, null);
    const payloadFigures = figures(0.3, null);
    getRunsTotalCostsMock.mockResolvedValueOnce(totals(null, null)).mockResolvedValue(payload);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {});
    expect(getRunsTotalCostsMock).toHaveBeenCalledOnce();
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.costs).toEqual(payloadFigures);
    expect(result.current.unavailable).toBe(false);
  });

  test('keeps polling well within the max-wait window instead of giving up early', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 100);
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.unavailable).toBe(false);
    expect(result.current.costs).toBeNull();
    expect(getRunsTotalCostsMock.mock.calls.length).toBeGreaterThan(50);
  });

  test('gives up and settles to a dash once the max wait elapses without a figure', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const neverReady = totals(null, null);
    const neverReadyFigures = figures(null, null);
    getRunsTotalCostsMock.mockResolvedValue(neverReady);

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_MAX_WAIT_MS + COST_FETCH_POLL_INTERVAL_MS);
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.unavailable).toBe(false);
    expect(result.current.costs).toEqual(neverReadyFigures);

    const callsAtGiveUp = getRunsTotalCostsMock.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 5);
    });

    // Settled, not just paused — no further attempts once the cards give up.
    expect(getRunsTotalCostsMock.mock.calls.length).toBe(callsAtGiveUp);
  });

  test('settles on an endpoint error raised by a later attempt', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getRunsTotalCostsMock.mockResolvedValueOnce(totals(null, null)).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {});
    expect(getRunsTotalCostsMock).toHaveBeenCalledOnce();
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
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));

    const { unmount } = renderHook(() => useRunCosts('run-1'));

    await act(async () => {});
    expect(getRunsTotalCostsMock).toHaveBeenCalledOnce();
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 5);
    });

    expect(getRunsTotalCostsMock).toHaveBeenCalledTimes(1);
  });
});

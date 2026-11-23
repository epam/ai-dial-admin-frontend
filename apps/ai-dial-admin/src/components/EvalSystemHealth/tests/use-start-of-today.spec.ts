import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useStartOfToday } from '@/src/components/EvalSystemHealth/use-start-of-today';

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('useStartOfToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 30, 23, 59, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('starts at the first instant of the current local day', () => {
    const { result } = renderHook(() => useStartOfToday());

    expect(result.current).toBe(new Date(2026, 10, 30).getTime());
  });

  test('keeps the day until midnight has passed', async () => {
    const { result } = renderHook(() => useStartOfToday());

    await advance(30_000);

    expect(result.current).toBe(new Date(2026, 10, 30).getTime());
  });

  test('moves to the next day, across a month boundary, once midnight has passed', async () => {
    const { result } = renderHook(() => useStartOfToday());

    await advance(61_000);

    expect(result.current).toBe(new Date(2026, 11, 1).getTime());
  });

  test('keeps rolling over on the following days', async () => {
    const { result } = renderHook(() => useStartOfToday());

    await advance(61_000);
    await advance(24 * 60 * 60 * 1000);

    expect(result.current).toBe(new Date(2026, 11, 2).getTime());
  });

  test('stops its timer on unmount', () => {
    const { unmount } = renderHook(() => useStartOfToday());

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

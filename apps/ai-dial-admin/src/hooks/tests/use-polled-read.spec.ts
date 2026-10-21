import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { usePolledRead } from '@/src/hooks/use-polled-read';

const INTERVAL = 5_000;

describe('usePolledRead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const tick = async (ms = INTERVAL) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  test('reads on every interval and hands each answer on', async () => {
    const read = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const onResult = vi.fn();

    renderHook(() => usePolledRead({ read, onResult, isTerminal: () => false, intervalMs: INTERVAL }));

    await tick();
    await tick();

    expect(onResult).toHaveBeenNthCalledWith(1, 1);
    expect(onResult).toHaveBeenNthCalledWith(2, 2);
  });

  test('does not read before the first interval has passed', async () => {
    const read = vi.fn().mockResolvedValue(1);

    renderHook(() => usePolledRead({ read, onResult: vi.fn(), isTerminal: () => false, intervalMs: INTERVAL }));
    await tick(INTERVAL - 1);

    expect(read).not.toHaveBeenCalled();
  });

  test('stops after an answer that says it is terminal', async () => {
    const read = vi.fn().mockResolvedValue('done');

    renderHook(() =>
      usePolledRead({ read, onResult: vi.fn(), isTerminal: (value: string) => value === 'done', intervalMs: INTERVAL }),
    );

    await tick();
    await tick();
    await tick();

    expect(read).toHaveBeenCalledOnce();
  });

  test('ignores a read that failed and tries again on the next tick', async () => {
    const read = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(7);
    const onResult = vi.fn();

    renderHook(() => usePolledRead({ read, onResult, isTerminal: () => false, intervalMs: INTERVAL }));

    await tick();
    await tick();

    expect(onResult).toHaveBeenCalledOnce();
    expect(onResult).toHaveBeenCalledWith(7);
  });

  test('reads nothing while it is not enabled', async () => {
    const read = vi.fn().mockResolvedValue(1);

    renderHook(() =>
      usePolledRead({ read, onResult: vi.fn(), isTerminal: () => false, intervalMs: INTERVAL, isEnabled: false }),
    );
    await tick(INTERVAL * 3);

    expect(read).not.toHaveBeenCalled();
  });

  test('starts reading when it becomes enabled and stops when it is turned off again', async () => {
    const read = vi.fn().mockResolvedValue(1);
    const { rerender } = renderHook(
      ({ isEnabled }) =>
        usePolledRead({ read, onResult: vi.fn(), isTerminal: () => false, intervalMs: INTERVAL, isEnabled }),
      { initialProps: { isEnabled: false } },
    );

    rerender({ isEnabled: true });
    await tick();
    rerender({ isEnabled: false });
    await tick(INTERVAL * 3);

    expect(read).toHaveBeenCalledOnce();
  });

  test('reads nothing after the caller unmounts', async () => {
    const read = vi.fn().mockResolvedValue(1);
    const { unmount } = renderHook(() =>
      usePolledRead({ read, onResult: vi.fn(), isTerminal: () => false, intervalMs: INTERVAL }),
    );

    unmount();
    await tick(INTERVAL * 3);

    expect(read).not.toHaveBeenCalled();
  });

  test('drops an answer that arrives after the caller unmounts', async () => {
    let resolveRead: (value: number) => void = () => undefined;
    const read = vi.fn(() => new Promise<number>((resolve) => (resolveRead = resolve)));
    const onResult = vi.fn();
    const { unmount } = renderHook(() =>
      usePolledRead({ read, onResult, isTerminal: () => false, intervalMs: INTERVAL }),
    );

    await tick();
    unmount();
    await act(async () => resolveRead(1));

    expect(onResult).not.toHaveBeenCalled();
  });

  test('skips a tick while the previous read is still in flight', async () => {
    const read = vi.fn(() => new Promise<number>(() => undefined));

    renderHook(() => usePolledRead({ read, onResult: vi.fn(), isTerminal: () => false, intervalMs: INTERVAL }));

    await tick();
    await tick();
    await tick();

    expect(read).toHaveBeenCalledOnce();
  });

  test('uses the callbacks of the latest render without restarting the timer', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const read = vi.fn().mockResolvedValue(1);
    const { rerender } = renderHook(
      ({ onResult }) => usePolledRead({ read, onResult, isTerminal: () => false, intervalMs: INTERVAL }),
      { initialProps: { onResult: first } },
    );

    await tick(INTERVAL - 1000);
    rerender({ onResult: second });
    await tick(1000);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(1);
  });
});

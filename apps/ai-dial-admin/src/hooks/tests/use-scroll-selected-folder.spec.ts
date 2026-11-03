import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useScrollSelectedFolder } from '@/src/hooks/use-scroll-selected-folder';

const POLL_MS = 500;

describe('useScrollSelectedFolder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('scrolls to the selected tree item once it mounts and stops polling', () => {
    const { result } = renderHook(() => useScrollSelectedFolder());
    act(() => result.current());

    document.body.innerHTML = '<div role="tree"><div aria-selected="true" id="sel"></div></div>';
    const target = document.getElementById('sel') as HTMLElement;
    target.scrollIntoView = vi.fn();

    act(() => {
      vi.advanceTimersByTime(POLL_MS);
    });
    act(() => {
      vi.advanceTimersByTime(POLL_MS * 3);
    });

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  test('ignores selected elements outside the tree', () => {
    document.body.innerHTML = '<div role="grid"><div aria-selected="true" id="cell"></div></div>';
    const cell = document.getElementById('cell') as HTMLElement;
    cell.scrollIntoView = vi.fn();
    const { result } = renderHook(() => useScrollSelectedFolder());
    act(() => result.current());

    act(() => {
      vi.advanceTimersByTime(POLL_MS * 25);
    });

    expect(cell.scrollIntoView).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

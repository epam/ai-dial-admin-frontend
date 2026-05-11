import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { useGridFollowOnUpdate } from '../use-grid-follow-on-update';

interface Row {
  id: string;
}

const getRowId = ({ data }: { data: Row }) => data.id;

const ROW_HEIGHT = 32;

const baseApi = () => {
  const listeners: Record<string, ((event?: unknown) => void)[]> = {};
  return {
    listeners,
    getVerticalPixelRange: vi.fn(() => ({ top: 0, bottom: 100 })),
    getFirstDisplayedRowIndex: vi.fn(() => 0),
    getLastDisplayedRowIndex: vi.fn(() => 20),
    getDisplayedRowAtIndex: vi.fn((idx: number) => ({
      data: { id: `row-${idx}` },
      level: 0,
      rowTop: idx * ROW_HEIGHT,
      rowHeight: ROW_HEIGHT,
    })),
    getRowNode: vi.fn((_id: string) => null as { rowIndex: number | null; rowTop: number | null } | null),
    ensureIndexVisible: vi.fn(),
    addEventListener: vi.fn((event: string, fn: (e?: unknown) => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(fn);
    }),
    removeEventListener: vi.fn((event: string, fn: (e?: unknown) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((l) => l !== fn);
    }),
    fire: (event: string) => {
      listeners[event]?.forEach((fn) => fn());
    },
  };
};

const fakeViewport = () => {
  const vp: { scrollTop: number } = { scrollTop: 0 };
  return {
    el: vp as unknown as HTMLElement,
    get: () => vp.scrollTop,
    set: (n: number) => {
      vp.scrollTop = n;
    },
  };
};

describe('useGridFollowOnUpdate', () => {
  test('auto-follow: when at top, ensureIndexVisible(0, top) is called on modelUpdated after rowData change', () => {
    const api = baseApi();
    api.getVerticalPixelRange.mockReturnValue({ top: 0, bottom: 100 });

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) => useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId }),
      { initialProps: { rowData: [{ id: 'a' }] as Row[] } },
    );

    api.ensureIndexVisible.mockClear();
    rerender({ rowData: [{ id: 'new' }, { id: 'a' }] });

    // Restoration is deferred to modelUpdated — until it fires, no scroll happens.
    expect(api.ensureIndexVisible).not.toHaveBeenCalled();

    api.fire('modelUpdated');
    expect(api.ensureIndexVisible).toHaveBeenCalledWith(0, 'top');
  });

  test('anchored read: anchor is the first row whose pixels intersect the viewport top, NOT the first rendered row (which can include buffer above the viewport)', () => {
    const api = baseApi();
    const vp = fakeViewport();

    // Viewport top is at pixel 192 (= 6 * ROW_HEIGHT). Rendered set starts
    // at index 4 (two buffer rows above the viewport: indices 4, 5).
    // The actual topmost VISIBLE row is row-6 (spans pixels 192–224).
    api.getVerticalPixelRange.mockReturnValue({ top: 192, bottom: 384 });
    api.getFirstDisplayedRowIndex.mockReturnValue(4);
    api.getLastDisplayedRowIndex.mockReturnValue(15);

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) =>
        useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId, getViewportEl: () => vp.el }),
      { initialProps: { rowData: [{ id: 'a' }, { id: 'b' }] as Row[] } },
    );

    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();

    // After the prepend, row-6 (the actual topmost visible) is now at index 7.
    // rowTop in the new layout: 7 * 32 = 224.
    api.getRowNode.mockImplementation((id: string) =>
      id === 'row-6' ? { rowIndex: 7, rowTop: 7 * ROW_HEIGHT } : null,
    );

    rerender({ rowData: [{ id: 'new' }, { id: 'a' }, { id: 'b' }] });
    api.fire('modelUpdated');

    expect(api.getRowNode).toHaveBeenCalledWith('row-6');
    expect(api.ensureIndexVisible).toHaveBeenCalledWith(7, 'top');
    // Crucially: it is NOT called with the buffer row's id ('row-4' or 'row-5').
    expect(api.getRowNode).not.toHaveBeenCalledWith('row-4');
    expect(api.getRowNode).not.toHaveBeenCalledWith('row-5');
    // Pre-update offset = rowTop(192) - scrollTop(192) = 0; row was flush at viewport top.
    // Post-update target scrollTop = newRowTop(224) - offset(0) = 224.
    expect(vp.get()).toBe(224);
  });

  test('mid-viewport anchor: preserves on-screen Y position via pixel-offset restore', () => {
    const api = baseApi();
    const vp = fakeViewport();

    // User scrolled to scrollTop=200. Rendered range starts at index 4.
    // Row-6 spans pixels 192–224 — its top sits 8px ABOVE the viewport top
    // (offset = rowTop(192) - scrollTop(200) = -8). The hook should pick
    // row-6 as anchor (first rendered row whose bottom > 200).
    api.getVerticalPixelRange.mockReturnValue({ top: 200, bottom: 400 });
    api.getFirstDisplayedRowIndex.mockReturnValue(4);
    api.getLastDisplayedRowIndex.mockReturnValue(15);

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) =>
        useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId, getViewportEl: () => vp.el }),
      { initialProps: { rowData: [{ id: 'a' }] as Row[] } },
    );

    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();

    // After prepend, row-6 is now at index 7 with rowTop = 7 * 32 = 224.
    api.getRowNode.mockImplementation((id: string) =>
      id === 'row-6' ? { rowIndex: 7, rowTop: 7 * ROW_HEIGHT } : null,
    );

    rerender({ rowData: [{ id: 'new' }, { id: 'a' }] });
    api.fire('modelUpdated');

    // Target scrollTop = newRowTop(224) - offset(-8) = 232. The anchor row
    // is again 8px above the viewport top — same on-screen position.
    expect(vp.get()).toBe(232);
  });

  test('anchored read: anchor row missing after update → no scroll restore', () => {
    const api = baseApi();
    const vp = fakeViewport();
    api.getVerticalPixelRange.mockReturnValue({ top: 192, bottom: 384 });
    api.getFirstDisplayedRowIndex.mockReturnValue(4);
    api.getLastDisplayedRowIndex.mockReturnValue(15);

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) =>
        useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId, getViewportEl: () => vp.el }),
      { initialProps: { rowData: [{ id: 'a' }] as Row[] } },
    );

    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();
    api.getRowNode.mockReturnValue(null);

    rerender({ rowData: [{ id: 'new' }, { id: 'a' }] });
    api.fire('modelUpdated');

    expect(api.ensureIndexVisible).not.toHaveBeenCalled();
    expect(vp.get()).toBe(0);
  });

  test('sortChanged drops the next restoration', () => {
    const api = baseApi();
    api.getVerticalPixelRange.mockReturnValue({ top: 0, bottom: 100 });

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) => useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId }),
      { initialProps: { rowData: [{ id: 'a' }] as Row[] } },
    );

    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();

    api.fire('sortChanged');
    rerender({ rowData: [{ id: 'b' }, { id: 'a' }] });
    api.fire('modelUpdated');
    expect(api.ensureIndexVisible).not.toHaveBeenCalled();

    // Subsequent updates resume normal anchoring.
    rerender({ rowData: [{ id: 'c' }, { id: 'b' }, { id: 'a' }] });
    api.fire('modelUpdated');
    expect(api.ensureIndexVisible).toHaveBeenCalledWith(0, 'top');
  });

  test('filterChanged drops the next restoration', () => {
    const api = baseApi();
    api.getVerticalPixelRange.mockReturnValue({ top: 0, bottom: 100 });

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) => useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId }),
      { initialProps: { rowData: [{ id: 'a' }] as Row[] } },
    );

    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();

    api.fire('filterChanged');
    rerender({ rowData: [{ id: 'b' }, { id: 'a' }] });
    api.fire('modelUpdated');
    expect(api.ensureIndexVisible).not.toHaveBeenCalled();
  });

  test('subscribes and unsubscribes from grid events on mount/unmount', () => {
    const api = baseApi();

    const { unmount } = renderHook(() =>
      useGridFollowOnUpdate({ gridApi: api as never, rowData: [{ id: 'a' }] as Row[], getRowId }),
    );

    expect(api.addEventListener).toHaveBeenCalledWith('modelUpdated', expect.any(Function));
    expect(api.addEventListener).toHaveBeenCalledWith('sortChanged', expect.any(Function));
    expect(api.addEventListener).toHaveBeenCalledWith('filterChanged', expect.any(Function));

    unmount();

    expect(api.removeEventListener).toHaveBeenCalledWith('modelUpdated', expect.any(Function));
    expect(api.removeEventListener).toHaveBeenCalledWith('sortChanged', expect.any(Function));
    expect(api.removeEventListener).toHaveBeenCalledWith('filterChanged', expect.any(Function));
  });

  test('treats small sub-tolerance scroll as still-at-top', () => {
    const api = baseApi();
    api.getVerticalPixelRange.mockReturnValue({ top: 5, bottom: 105 });

    const { rerender } = renderHook(
      ({ rowData }: { rowData: Row[] }) => useGridFollowOnUpdate({ gridApi: api as never, rowData, getRowId }),
      { initialProps: { rowData: [{ id: 'a' }] as Row[] } },
    );

    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();

    rerender({ rowData: [{ id: 'b' }, { id: 'a' }] });
    api.fire('modelUpdated');

    expect(api.ensureIndexVisible).toHaveBeenCalledWith(0, 'top');
  });

  test('does not restore if modelUpdated fires without a pending capture (e.g. unrelated grid events)', () => {
    const api = baseApi();
    const { result: _result } = renderHook(() =>
      useGridFollowOnUpdate({ gridApi: api as never, rowData: [{ id: 'a' }] as Row[], getRowId }),
    );

    // Initial mount sets restorePendingRef = true and the test triggers modelUpdated to consume it.
    api.fire('modelUpdated');
    api.ensureIndexVisible.mockClear();

    // Subsequent modelUpdated events without a rowData change should be no-ops.
    api.fire('modelUpdated');
    expect(api.ensureIndexVisible).not.toHaveBeenCalled();
  });
});

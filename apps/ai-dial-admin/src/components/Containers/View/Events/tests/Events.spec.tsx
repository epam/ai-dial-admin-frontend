import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockState } = vi.hoisted(() => ({
  mockState: { lastProps: null as Record<string, unknown> | null },
}));

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: Record<string, unknown>) => {
    mockState.lastProps = props;
    return null;
  },
}));

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

import Events from '../Events';

const baseEvent = (id: string, ts: number) =>
  ({
    id,
    message: `Event ${id}`,
    reason: 'Reason',
    count: 1,
    firstTimestamp: ts,
  }) as never;

const ROW_HEIGHT = 32;

const createFakeApi = () => {
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
    applyColumnState: vi.fn(),
    setFilterModel: vi.fn(),
    updateGridOptions: vi.fn(),
    getColumnState: vi.fn(() => []),
    getFilterModel: vi.fn(() => ({})),
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

const fireOnGridReady = (api: ReturnType<typeof createFakeApi>) => {
  act(() => {
    const onGridReady = mockState.lastProps?.onGridReady as ((event: { api: unknown }) => void) | undefined;
    onGridReady?.({ api });
  });
};

describe('Events', () => {
  beforeEach(() => {
    mockState.lastProps = null;
  });

  test('renders empty state when there are no events', () => {
    render(<Events route={ApplicationRoute.McpContainers} events={[]} />);
    expect(screen.getByText(EntitiesI18nKey.NoEvents)).toBeInTheDocument();
  });

  test('passes isLiveData and getRowId to the underlying AG Grid', () => {
    render(<Events route={ApplicationRoute.McpContainers} events={[baseEvent('1', 1)]} />);

    expect(mockState.lastProps?.rowData).toEqual([baseEvent('1', 1)]);
    expect(typeof mockState.lastProps?.getRowId).toBe('function');

    const getRowId = mockState.lastProps?.getRowId as (p: { data: { id: string } }) => string;
    expect(getRowId({ data: { id: 'abc' } })).toBe('abc');
  });

  test('auto-follow: at-top scroll → ensureIndexVisible(0, top) on modelUpdated after prepend', () => {
    const api = createFakeApi();
    api.getVerticalPixelRange.mockReturnValue({ top: 0, bottom: 100 });

    const { rerender } = render(<Events route={ApplicationRoute.McpContainers} events={[baseEvent('a', 1)]} />);
    fireOnGridReady(api);

    // Drain the initial pending restoration triggered by mount.
    act(() => api.fire('modelUpdated'));
    api.ensureIndexVisible.mockClear();

    rerender(<Events route={ApplicationRoute.McpContainers} events={[baseEvent('new', 2), baseEvent('a', 1)]} />);
    act(() => api.fire('modelUpdated'));

    expect(api.ensureIndexVisible).toHaveBeenCalledWith(0, 'top');
  });

  test('anchored read: anchor is the first row whose pixels intersect the viewport top, not a buffer row above it', () => {
    const api = createFakeApi();
    // Viewport top at pixel 192 (= 6 * ROW_HEIGHT). Render buffer starts at index 4.
    // Topmost VISIBLE row is row-6 (spans 192–224); rows 4 and 5 are buffer-only.
    api.getVerticalPixelRange.mockReturnValue({ top: 192, bottom: 384 });
    api.getFirstDisplayedRowIndex.mockReturnValue(4);
    api.getLastDisplayedRowIndex.mockReturnValue(15);

    const initial = [baseEvent('a', 1), baseEvent('b', 2)];
    const { rerender } = render(<Events route={ApplicationRoute.McpContainers} events={initial} />);
    fireOnGridReady(api);

    act(() => api.fire('modelUpdated'));
    api.ensureIndexVisible.mockClear();

    // After the prepend, row-6 is now at index 7 with rowTop = 7 * 32 = 224.
    api.getRowNode.mockImplementation((id: string) =>
      id === 'row-6' ? { rowIndex: 7, rowTop: 7 * ROW_HEIGHT } : null,
    );

    rerender(<Events route={ApplicationRoute.McpContainers} events={[baseEvent('new', 3), ...initial]} />);
    act(() => api.fire('modelUpdated'));

    expect(api.getRowNode).toHaveBeenCalledWith('row-6');
    expect(api.ensureIndexVisible).toHaveBeenCalledWith(7, 'top');
  });
});

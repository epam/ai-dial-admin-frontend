import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { GridApi } from 'ag-grid-community';

import { Run, RunStatus } from '@/src/models/evaluation/run';
import { useRunStatusStream } from '../useRunStatusStream';

const getRunsQueryMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunsQuery: (...args: unknown[]) => getRunsQueryMock(...args),
}));

type Listener = (event: { data?: unknown }) => void;

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: MockEventSource[] = [];

  url: string;
  readyState: number = MockEventSource.CONNECTING;
  listeners: Record<string, Listener[]> = {};

  addEventListener = vi.fn((name: string, fn: Listener) => {
    (this.listeners[name] ||= []).push(fn);
  });
  close = vi.fn(() => {
    this.readyState = MockEventSource.CLOSED;
  });

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  dispatch(name: string, data?: unknown) {
    (this.listeners[name] || []).forEach((fn) => fn({ data }));
  }
}

vi.stubGlobal('EventSource', MockEventSource);

const createGridApi = (rows: Run[]) => {
  const nodes = rows.map((row) => {
    const node = {
      data: row,
      setData: vi.fn((next: Run) => {
        node.data = next;
      }),
    };
    return node;
  });

  return {
    nodes,
    gridApi: {
      forEachNode: (callback: (node: unknown) => void) => nodes.forEach(callback),
    } as unknown as GridApi,
  };
};

const dispatchStatusUpdate = (payload: Record<string, unknown>) => {
  MockEventSource.instances[0].dispatch('status-update', JSON.stringify(payload));
};

describe('useRunStatusStream', () => {
  beforeEach(() => {
    getRunsQueryMock.mockReset();
    MockEventSource.instances = [];
  });

  test('opens the status stream with the given test suite id', () => {
    const { gridApi } = createGridApi([]);
    renderHook(() => useRunStatusStream('suite-1', gridApi));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/runs/status-stream?testSuiteIds=suite-1');
  });

  test('does not open the stream without a test suite id or a grid', () => {
    const { gridApi } = createGridApi([]);
    renderHook(() => useRunStatusStream(undefined, gridApi));
    renderHook(() => useRunStatusStream('suite-1', null));

    expect(MockEventSource.instances).toHaveLength(0);
  });

  test('patches status and completedAt in place for a non-terminal update', () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.PENDING }]);
    renderHook(() => useRunStatusStream('suite-1', gridApi));

    dispatchStatusUpdate({ runId: 'run-1', status: RunStatus.RUNNING, timestamp: 123 });

    expect(nodes[0].setData).toHaveBeenCalledWith(
      expect.objectContaining({ status: RunStatus.RUNNING, completedAt: 123 }),
    );
    expect(getRunsQueryMock).not.toHaveBeenCalled();
  });

  test('refetches the full run and merges metrics/overall score once it completes', async () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.RUNNING }]);
    getRunsQueryMock.mockResolvedValue({
      content: [
        {
          id: 'run-1',
          status: RunStatus.COMPLETED,
          metricNames: ['accuracy'],
          overallScoreValue: 0.87,
        },
      ],
    });

    renderHook(() => useRunStatusStream('suite-1', gridApi));
    dispatchStatusUpdate({ runId: 'run-1', status: RunStatus.COMPLETED, timestamp: 456 });
    await vi.waitFor(() => expect(getRunsQueryMock).toHaveBeenCalled());

    expect(getRunsQueryMock).toHaveBeenCalledWith(0, 1, [], [{ column: 'id', operator: 'eq', value: 'run-1' }]);
    expect(nodes[0].setData).toHaveBeenCalledWith(
      expect.objectContaining({ status: RunStatus.COMPLETED, metricNames: ['accuracy'], overallScoreValue: 0.87 }),
    );
  });

  test.each([RunStatus.FAILED, RunStatus.CANCELLED])('also refetches on a terminal %s status', async (status) => {
    const { gridApi } = createGridApi([{ id: 'run-1', status: RunStatus.RUNNING }]);
    getRunsQueryMock.mockResolvedValue({ content: [{ id: 'run-1', status }] });

    renderHook(() => useRunStatusStream('suite-1', gridApi));
    dispatchStatusUpdate({ runId: 'run-1', status, timestamp: 1 });
    await vi.waitFor(() => expect(getRunsQueryMock).toHaveBeenCalled());
  });

  test('falls back to a status-only patch when the refetch finds no row', async () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.RUNNING }]);
    getRunsQueryMock.mockResolvedValue({ content: [] });

    renderHook(() => useRunStatusStream('suite-1', gridApi));
    dispatchStatusUpdate({ runId: 'run-1', status: RunStatus.COMPLETED, timestamp: 789 });
    await vi.waitFor(() =>
      expect(nodes[0].setData).toHaveBeenCalledWith(
        expect.objectContaining({ status: RunStatus.COMPLETED, completedAt: 789 }),
      ),
    );
  });

  test('falls back to a status-only patch when the refetch rejects', async () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.RUNNING }]);
    getRunsQueryMock.mockRejectedValue(new Error('network error'));

    renderHook(() => useRunStatusStream('suite-1', gridApi));
    dispatchStatusUpdate({ runId: 'run-1', status: RunStatus.COMPLETED, timestamp: 789 });
    await vi.waitFor(() =>
      expect(nodes[0].setData).toHaveBeenCalledWith(
        expect.objectContaining({ status: RunStatus.COMPLETED, completedAt: 789 }),
      ),
    );
  });

  test('ignores malformed event payloads', () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.RUNNING }]);
    renderHook(() => useRunStatusStream('suite-1', gridApi));

    expect(() => MockEventSource.instances[0].dispatch('status-update', 'not-json')).not.toThrow();
    expect(nodes[0].setData).not.toHaveBeenCalled();
  });

  test('closes the stream on unmount', () => {
    const { gridApi } = createGridApi([]);
    const { unmount } = renderHook(() => useRunStatusStream('suite-1', gridApi));

    unmount();

    expect(MockEventSource.instances[0].close).toHaveBeenCalledOnce();
  });
});

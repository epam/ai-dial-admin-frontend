import { renderHook } from '@testing-library/react';
import { GridApi } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { COST_FETCH_POLL_INTERVAL_MS } from '@/src/components/Runs/Summary/constants';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { useCalculatingRunCostsPoll } from '../useCalculatingRunCostsPoll';
import { RUN_IDS_FILTER } from '../constants';

const getRunsQueryMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunsQuery: (...args: unknown[]) => getRunsQueryMock(...args),
}));

const NOW = 1_700_000_000_000;

interface MockNode {
  data: Run;
  setData: (next: Run) => void;
}

const buildGrid = (rows: Run[]) => {
  const nodes: MockNode[] = rows.map((data) => {
    const node: MockNode = {
      data,
      setData: vi.fn((next: Run) => {
        node.data = next;
      }),
    };
    return node;
  });
  const api = { forEachNode: (cb: (n: MockNode) => void) => nodes.forEach(cb) } as unknown as GridApi;
  return { api, nodes };
};

describe('useCalculatingRunCostsPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    getRunsQueryMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('re-fetches a settled row without a cost and patches the grid with the result', async () => {
    const { api, nodes } = buildGrid([{ id: 'run-1', status: RunStatus.COMPLETED, completedAt: NOW - 1000 }]);
    getRunsQueryMock.mockResolvedValue({ content: [{ id: 'run-1', totalCost: 0.5 }] });

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    expect(getRunsQueryMock).toHaveBeenCalledOnce();
    expect(nodes[0].setData).toHaveBeenCalledWith(expect.objectContaining({ id: 'run-1', totalCost: 0.5 }));
  });

  test('polls all calculating rows in a single batched query', async () => {
    const { api, nodes } = buildGrid([
      { id: 'run-1', status: RunStatus.COMPLETED, completedAt: NOW - 1000 },
      { id: 'run-2', status: RunStatus.FAILED, costWaitStartedAt: NOW - 1000 },
    ]);
    getRunsQueryMock.mockResolvedValue({ content: [{ id: 'run-2', totalCost: 2 }] });

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    expect(getRunsQueryMock).toHaveBeenCalledOnce();
    expect(getRunsQueryMock).toHaveBeenCalledWith(0, 2, [], [RUN_IDS_FILTER(['run-1', 'run-2'])]);
    expect(nodes[1].setData).toHaveBeenCalledWith(expect.objectContaining({ id: 'run-2', totalCost: 2 }));
  });

  test('does not poll a row that completed over 12 hours ago', async () => {
    const { api } = buildGrid([
      { id: 'old', status: RunStatus.COMPLETED, completedAt: NOW - 24 * 60 * 60 * 1000, costWaitStartedAt: NOW },
    ]);

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    expect(getRunsQueryMock).not.toHaveBeenCalled();
  });

  test('polls a row finished well before the grid saw it once the grid has opened its wait window', async () => {
    const { api } = buildGrid([
      { id: 'old', status: RunStatus.COMPLETED, completedAt: NOW - 60 * 60 * 1000, costWaitStartedAt: NOW },
    ]);
    getRunsQueryMock.mockResolvedValue({ content: [] });

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    expect(getRunsQueryMock).toHaveBeenCalledOnce();
  });

  test('skips rows that already have a cost, are still running, or were never stamped and settled long ago', async () => {
    const { api } = buildGrid([
      { id: 'priced', status: RunStatus.COMPLETED, completedAt: NOW - 1000, totalCost: 1 },
      { id: 'running', status: RunStatus.RUNNING },
      { id: 'old', status: RunStatus.COMPLETED, completedAt: NOW - 24 * 60 * 60 * 1000 },
    ]);

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    expect(getRunsQueryMock).not.toHaveBeenCalled();
  });

  test('re-sets a row with its own data when the re-fetch returns nothing, so the cell re-renders', async () => {
    const run: Run = { id: 'run-1', status: RunStatus.COMPLETED, completedAt: NOW - 1000 };
    const { api, nodes } = buildGrid([run]);
    getRunsQueryMock.mockResolvedValue({ content: [] });

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    expect(nodes[0].setData).toHaveBeenCalledWith(run);
  });

  test('keeps polling after a failed query', async () => {
    const { api } = buildGrid([{ id: 'run-1', status: RunStatus.COMPLETED, completedAt: NOW - 1000 }]);
    getRunsQueryMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ content: [] });

    renderHook(() => useCalculatingRunCostsPoll(api));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 2);

    expect(getRunsQueryMock).toHaveBeenCalledTimes(2);
  });

  test('does nothing before the grid is ready and stops polling on unmount', async () => {
    const { api } = buildGrid([{ id: 'run-1', status: RunStatus.COMPLETED, completedAt: NOW - 1000 }]);
    getRunsQueryMock.mockResolvedValue({ content: [] });

    renderHook(() => useCalculatingRunCostsPoll(null));
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
    expect(getRunsQueryMock).not.toHaveBeenCalled();

    const { unmount } = renderHook(() => useCalculatingRunCostsPoll(api));
    unmount();
    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);
    expect(getRunsQueryMock).not.toHaveBeenCalled();
  });
});

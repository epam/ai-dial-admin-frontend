import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { GridApi } from 'ag-grid-community';

import { useCancellingRunsPoll } from '@/src/components/Runs/Cancel/useCancellingRunsPoll';
import { RunsI18nKey } from '@/src/constants/i18n';
import { RUN_CANCEL_POLL_INTERVAL } from '@/src/constants/runs';
import { NotificationType } from '@/src/models/notification';
import { Run, RunStatus } from '@/src/models/evaluation/run';

const getRunMock = vi.fn();
const showNotification = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (id: string) => getRunMock(id),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

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

const tick = async () => {
  await vi.advanceTimersByTimeAsync(RUN_CANCEL_POLL_INTERVAL);
};

describe('useCancellingRunsPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getRunMock.mockReset();
    showNotification.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('polls a row that is already cancelling on mount, without any user action', async () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);
    getRunMock.mockResolvedValue({ id: 'run-1', status: RunStatus.CANCELLED });

    renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();

    expect(getRunMock).toHaveBeenCalledWith('run-1');
    expect(nodes[0].setData).toHaveBeenCalledWith(expect.objectContaining({ status: RunStatus.CANCELLED }));
  });

  test('issues no request when no row is cancelling', async () => {
    const { gridApi } = createGridApi([
      { id: 'run-1', status: RunStatus.RUNNING },
      { id: 'run-2', status: RunStatus.COMPLETED },
    ]);

    renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();

    expect(getRunMock).not.toHaveBeenCalled();
  });

  test('polls every cancelling row on the same tick', async () => {
    const { gridApi } = createGridApi([
      { id: 'run-1', status: RunStatus.CANCELLING },
      { id: 'run-2', status: RunStatus.RUNNING },
      { id: 'run-3', status: RunStatus.CANCELLING },
    ]);
    getRunMock.mockResolvedValue({ status: RunStatus.CANCELLED });

    renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();

    expect(getRunMock).toHaveBeenCalledWith('run-1');
    expect(getRunMock).toHaveBeenCalledWith('run-3');
    expect(getRunMock).not.toHaveBeenCalledWith('run-2');
  });

  test('keeps polling while the run is still cancelling', async () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);
    getRunMock.mockResolvedValue({ id: 'run-1', status: RunStatus.CANCELLING });

    renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();
    await tick();

    expect(getRunMock).toHaveBeenCalledTimes(2);
    expect(nodes[0].setData).not.toHaveBeenCalled();
  });

  test.each([RunStatus.CANCELLED, RunStatus.COMPLETED, RunStatus.FAILED])(
    'stops polling once the run settles as %s',
    async (status) => {
      const { gridApi } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);
      getRunMock.mockResolvedValue({ id: 'run-1', status });

      renderHook(() => useCancellingRunsPoll(gridApi));
      await tick();
      await tick();

      expect(getRunMock).toHaveBeenCalledOnce();
    },
  );

  test('stops polling on unmount', async () => {
    const { gridApi } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);
    getRunMock.mockResolvedValue({ id: 'run-1', status: RunStatus.CANCELLING });

    const { unmount } = renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();
    unmount();
    await tick();

    expect(getRunMock).toHaveBeenCalledOnce();
  });

  test('issues no request while disabled', async () => {
    const { gridApi } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);

    renderHook(() => useCancellingRunsPoll(gridApi, false));
    await tick();

    expect(getRunMock).not.toHaveBeenCalled();
  });

  test('issues no request before the grid is ready', async () => {
    renderHook(() => useCancellingRunsPoll(null));
    await tick();

    expect(getRunMock).not.toHaveBeenCalled();
  });

  test('reports a failed cancellation once when the run comes back running', async () => {
    const { gridApi, nodes } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);
    getRunMock.mockResolvedValue({ id: 'run-1', status: RunStatus.RUNNING });

    renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.error, title: RunsI18nKey.CancelRunFailed }),
    );
    expect(nodes[0].setData).toHaveBeenCalledWith(expect.objectContaining({ status: RunStatus.RUNNING }));
  });

  test('reports one failed cancellation per regressing run', async () => {
    const { gridApi } = createGridApi([
      { id: 'run-1', status: RunStatus.CANCELLING },
      { id: 'run-2', status: RunStatus.CANCELLING },
    ]);
    getRunMock.mockImplementation((id: string) => Promise.resolve({ id, status: RunStatus.RUNNING }));

    renderHook(() => useCancellingRunsPoll(gridApi));
    await tick();

    expect(showNotification).toHaveBeenCalledTimes(2);
  });

  test.each([RunStatus.CANCELLED, RunStatus.COMPLETED, RunStatus.FAILED])(
    'reports nothing when the run settles as %s',
    async (status) => {
      const { gridApi } = createGridApi([{ id: 'run-1', status: RunStatus.CANCELLING }]);
      getRunMock.mockResolvedValue({ id: 'run-1', status });

      renderHook(() => useCancellingRunsPoll(gridApi));
      await tick();

      expect(showNotification).not.toHaveBeenCalled();
    },
  );
});

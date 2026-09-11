import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { cancelRun, getRun } from '@/src/app/[lang]/runs/actions';
import { ActionMenuOperationI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { RUN_CANCEL_POLL_INTERVAL } from '@/src/constants/runs';
import { NotificationType } from '@/src/models/notification';
import { RunStatus } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import EvaluationListView from '../List';

const routerRefresh = vi.fn();
const showNotification = vi.fn();

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: routerRefresh }) }));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  cancelRun: vi.fn(),
  getRun: vi.fn(),
}));

vi.mock('@/src/components/Runs/Compare/useCompareRunLauncher', () => ({
  useCompareRunLauncher: () => ({ openCompareRun: vi.fn(), compareRunModal: null }),
}));

vi.mock('@/src/components/Runs/Cancel/RunCancelModal', () => ({
  default: ({ onCancelRun, onSuccess }: any) => (
    <div role="dialog" aria-label="cancel-run-modal">
      <button
        type="button"
        onClick={() => {
          onCancelRun('run-running');
          onSuccess?.();
        }}
      >
        Confirm Cancel
      </button>
    </div>
  ),
}));

const nodeSetData = vi.fn();

const MOCK_ROWS = [
  { id: 'run-running', status: RunStatus.RUNNING },
  { id: 'run-completed', status: RunStatus.COMPLETED },
  { id: 'run-cancelling', status: RunStatus.CANCELLING },
];

const mockGridApi = {
  setGridOption: vi.fn(),
  forEachNode: vi.fn((callback: (node: { data: (typeof MOCK_ROWS)[number]; setData: typeof nodeSetData }) => void) => {
    MOCK_ROWS.forEach((row) => callback({ data: row, setData: nodeSetData }));
  }),
};

vi.mock('@/src/components/ListView/List', () => ({
  default: ({ columnDefs, onGridReady }: any) => {
    onGridReady?.({ api: mockGridApi });
    const actionCol = (columnDefs || []).find((col: any) => col.field === 'actionsColumn');
    const items = actionCol?.cellRendererParams?.items ?? [];

    return (
      <div role="grid" aria-label="evaluation-list">
        {MOCK_ROWS.map((row) => (
          <div key={row.id} role="row">
            {items
              .filter((item: any) => !item.hidden?.(null, { data: row }))
              .map((item: any) => (
                <button key={item.id} type="button" onClick={() => item.onClick(row)}>
                  {item.label}:{row.id}
                </button>
              ))}
          </div>
        ))}
      </div>
    );
  },
}));

const noopGetData = vi.fn().mockResolvedValue({ content: [], totalElements: 0 });

describe('EvaluationListView', () => {
  test('shows the Stop action only for a running row when route is Runs', () => {
    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);

    expect(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-completed` }),
    ).not.toBeInTheDocument();
  });

  test('does not show the Stop action for a non-Runs route', () => {
    render(<EvaluationListView route={ApplicationRoute.TestSuites} baseColumns={[]} getData={noopGetData} />);

    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }),
    ).not.toBeInTheDocument();
  });

  test('opens the confirmation modal instead of cancelling immediately', () => {
    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);

    expect(screen.queryByRole('dialog', { name: 'cancel-run-modal' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));

    expect(screen.getByRole('dialog', { name: 'cancel-run-modal' })).toBeInTheDocument();
    expect(cancelRun).not.toHaveBeenCalled();
  });

  test('patches only the cancelled row to CANCELLING after a successful confirmed cancel, without refreshing the page', () => {
    routerRefresh.mockClear();
    nodeSetData.mockClear();

    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    expect(cancelRun).toHaveBeenCalledWith('run-running');
    expect(nodeSetData).toHaveBeenCalledOnce();
    expect(nodeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-running', status: RunStatus.CANCELLING }),
    );
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});

describe('EvaluationListView — polling cancelling rows', () => {
  const tick = async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RUN_CANCEL_POLL_INTERVAL);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    nodeSetData.mockClear();
    vi.mocked(getRun).mockReset();
    showNotification.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('polls the cancelling row and writes back its settled status for the Runs route', async () => {
    vi.mocked(getRun).mockResolvedValue({ id: 'run-cancelling', status: RunStatus.CANCELLED } as any);

    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);
    await tick();

    expect(getRun).toHaveBeenCalledOnce();
    expect(getRun).toHaveBeenCalledWith('run-cancelling');
    expect(nodeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-cancelling', status: RunStatus.CANCELLED }),
    );
  });

  test.each([ApplicationRoute.TestSuites, ApplicationRoute.Datasets, ApplicationRoute.Metrics])(
    'does not poll for the %s route',
    async (route) => {
      render(<EvaluationListView route={route} baseColumns={[]} getData={noopGetData} />);
      await tick();

      expect(getRun).not.toHaveBeenCalled();
    },
  );

  test('reports a failed cancellation once when a polled row comes back running', async () => {
    vi.mocked(getRun).mockResolvedValue({ id: 'run-cancelling', status: RunStatus.RUNNING } as any);

    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);
    await tick();

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.error, title: RunsI18nKey.CancelRunFailed }),
    );
    expect(nodeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-cancelling', status: RunStatus.RUNNING }),
    );
  });

  test('reports nothing when a polled row settles as cancelled', async () => {
    vi.mocked(getRun).mockResolvedValue({ id: 'run-cancelling', status: RunStatus.CANCELLED } as any);

    render(<EvaluationListView route={ApplicationRoute.Runs} baseColumns={[]} getData={noopGetData} />);
    await tick();

    expect(showNotification).not.toHaveBeenCalled();
  });
});

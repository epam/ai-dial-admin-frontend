import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { cancelRun, getRun } from '@/src/app/[lang]/runs/actions';
import { getRuns } from '@/src/app/[lang]/test-suites/actions';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { RUN_CANCEL_POLL_INTERVAL } from '@/src/constants/runs';
import { RunStatus } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Runs from '../Runs';

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getRuns: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
}));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  removeRun: vi.fn(),
  cancelRun: vi.fn(),
  getRun: vi.fn(),
}));

vi.mock('../useRunStatusStream', () => ({
  useRunStatusStream: vi.fn(),
}));

vi.mock('@/src/components/Runs/Compare/useCompareRunLauncher', () => ({
  useCompareRunLauncher: () => ({ openCompareRun: vi.fn(), compareRunModal: null }),
}));

const showNotification = vi.fn();

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

const nodeSetData = vi.fn();

const MOCK_ROWS = [
  { id: 'run-running', status: RunStatus.RUNNING },
  { id: 'run-completed', status: RunStatus.COMPLETED },
  { id: 'run-failed', status: RunStatus.FAILED },
  { id: 'run-cancelled', status: RunStatus.CANCELLED },
  { id: 'run-cancelling', status: RunStatus.CANCELLING },
];

const mockGridApi = {
  setGridOption: vi.fn(),
  hideOverlay: vi.fn(),
  showNoRowsOverlay: vi.fn(),
  forEachNode: vi.fn((callback: (node: { data: (typeof MOCK_ROWS)[number]; setData: typeof nodeSetData }) => void) => {
    MOCK_ROWS.forEach((row) => callback({ data: row, setData: nodeSetData }));
  }),
};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ columnDefs, onGridReady }: any) => {
    onGridReady?.({ api: mockGridApi });
    const actionCol = (columnDefs || []).find((col: any) => col.field === 'actionsColumn');
    const items = actionCol?.cellRendererParams?.items ?? [];

    return (
      <div role="grid" aria-label="runs-grid">
        {MOCK_ROWS.map((row) => (
          <div key={row.id} role="row">
            {items
              .filter((item: any) => !item.hidden?.(mockGridApi, { data: row }))
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

vi.mock('@/src/components/Runs/Cancel/RunCancelModal', () => ({
  default: ({ run, onCancelRun }: any) => (
    <div role="dialog" aria-label="cancel-run-modal">
      <button type="button" onClick={() => onCancelRun(run.id)}>
        Confirm Cancel
      </button>
    </div>
  ),
}));

describe('Runs', () => {
  const selectedTestSuite = { id: 'suite-1' } as TestSuite;
  const runRefreshRef = { current: null };

  test('shows the Stop action only for running rows', () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    expect(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-completed` }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-failed` }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-cancelled` }),
    ).not.toBeInTheDocument();
  });

  test('opens the confirmation modal instead of cancelling immediately', () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    expect(screen.queryByRole('dialog', { name: 'cancel-run-modal' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));

    expect(screen.getByRole('dialog', { name: 'cancel-run-modal' })).toBeInTheDocument();
    expect(cancelRun).not.toHaveBeenCalled();
  });

  test('patches only the cancelled row to CANCELLING after a successful confirmed cancel, without reloading the grid', async () => {
    vi.mocked(cancelRun).mockResolvedValue({ success: true });
    nodeSetData.mockClear();

    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    // Let the initial getRuns() fetch settle so its own datasource refresh isn't mistaken for one
    // triggered by the cancel confirmation below.
    await waitFor(() => expect(getRuns).toHaveBeenCalled());
    await act(() => Promise.resolve());
    const datasourceCallsAfterMount = mockGridApi.setGridOption.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    await waitFor(() => expect(cancelRun).toHaveBeenCalledWith('run-running'));
    expect(nodeSetData).toHaveBeenCalledOnce();
    expect(nodeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-running', status: RunStatus.CANCELLING }),
    );
    expect(mockGridApi.setGridOption.mock.calls.length).toBe(datasourceCallsAfterMount);
  });

  test('does not patch any row when the confirmed cancel fails', async () => {
    vi.mocked(cancelRun).mockResolvedValue({ success: false, errorHeader: 'Error', errorMessage: 'failed' });
    nodeSetData.mockClear();

    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    await waitFor(() => expect(cancelRun).toHaveBeenCalledWith('run-running'));
    expect(nodeSetData).not.toHaveBeenCalled();
  });
});

describe('Runs — polling cancelling rows', () => {
  const selectedTestSuite = { id: 'suite-1' } as TestSuite;
  const runRefreshRef = { current: null };

  beforeEach(() => {
    vi.useFakeTimers();
    nodeSetData.mockClear();
    vi.mocked(getRun).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('polls only the cancelling row and writes back its settled status', async () => {
    vi.mocked(getRun).mockResolvedValue({ id: 'run-cancelling', status: RunStatus.CANCELLED } as any);

    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RUN_CANCEL_POLL_INTERVAL);
    });

    expect(getRun).toHaveBeenCalledOnce();
    expect(getRun).toHaveBeenCalledWith('run-cancelling');
    expect(nodeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-cancelling', status: RunStatus.CANCELLED }),
    );
  });
});

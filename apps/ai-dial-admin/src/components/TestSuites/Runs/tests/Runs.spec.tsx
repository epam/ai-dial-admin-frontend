import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { cancelRun, getRun, getRunsQuery } from '@/src/app/[lang]/runs/actions';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { RUN_CANCEL_POLL_INTERVAL } from '@/src/constants/runs';
import { RunStatus } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import Runs from '../Runs';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  removeRun: vi.fn(),
  cancelRun: vi.fn(),
  getRun: vi.fn(),
  getRunsQuery: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
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
  { id: 'run-pending', status: RunStatus.PENDING },
  { id: 'run-completed', status: RunStatus.COMPLETED },
  { id: 'run-failed', status: RunStatus.FAILED },
  { id: 'run-cancelled', status: RunStatus.CANCELLED },
  { id: 'run-cancelling', status: RunStatus.CANCELLING },
];

/** The grid options the component hands the grid, so a test can fire the grid's own callbacks. */
const gridProps: { additionalGridOptions?: any; datasource?: any } = {};

const mockGridApi = {
  setGridOption: vi.fn((option: string, value: unknown) => {
    if (option === 'datasource') {
      gridProps.datasource = value;
    }
  }),
  refreshInfiniteCache: vi.fn(),
  hideOverlay: vi.fn(),
  showNoRowsOverlay: vi.fn(),
  forEachNode: vi.fn((callback: (node: { data: (typeof MOCK_ROWS)[number]; setData: typeof nodeSetData }) => void) => {
    MOCK_ROWS.forEach((row) => callback({ data: row, setData: nodeSetData }));
  }),
};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ columnDefs, onGridReady, additionalGridOptions, showColumnsPanel }: any) => {
    gridProps.additionalGridOptions = additionalGridOptions;
    onGridReady?.({ api: mockGridApi });
    const actionCol = (columnDefs || []).find((col: any) => col.field === 'actionsColumn');
    const items = actionCol?.cellRendererParams?.items ?? [];

    return (
      <div role="grid" aria-label="runs-grid">
        {showColumnsPanel && <div role="region" aria-label="columns-panel" />}
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

/** What the grid does when it first reads from its datasource (or after a purge): ask for rows. */
const requestRows = (params: Record<string, unknown> = {}) => {
  const successCallback = vi.fn();
  gridProps.datasource.getRows({
    startRow: 0,
    endRow: 50,
    sortModel: [],
    filterModel: {},
    successCallback,
    failCallback: vi.fn(),
    ...params,
  });
  return successCallback;
};

/** One grid request, resolved: the rows the grid ends up with. */
const requestRowsAndWait = async (params: Record<string, unknown> = {}) => {
  const successCallback = requestRows(params);
  await vi.waitFor(() => expect(successCallback).toHaveBeenCalled());
  return successCallback;
};

describe('Runs', () => {
  const selectedTestSuite = { id: 'suite-1' } as TestSuite;
  const runRefreshRef = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the Stop action only for running and pending rows', () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    expect(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-pending` })).toBeInTheDocument();
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

  test('shows the total number of runs rather than the number of rows loaded on the first page', async () => {
    vi.mocked(getRunsQuery).mockResolvedValueOnce({
      content: MOCK_ROWS,
      totalElements: 250,
    } as Awaited<ReturnType<typeof getRunsQuery>>);

    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    requestRows();

    expect(await screen.findByText(`${TabsI18nKey.Runs}: 250`)).toBeInTheDocument();
  });

  test('toggles the columns panel when the Columns button is clicked', () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    expect(screen.queryByRole('region', { name: 'columns-panel' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Columns }));

    expect(screen.getByRole('region', { name: 'columns-panel' })).toBeInTheDocument();
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
    // Let the grid's first load settle so its own option writes aren't mistaken for ones triggered by
    // the cancel confirmation below.
    await requestRowsAndWait();
    await act(() => Promise.resolve());
    const datasourceCallsAfterMount = mockGridApi.setGridOption.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Stop}:run-running` }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancel' }));

    await vi.waitFor(() => expect(nodeSetData).toHaveBeenCalledOnce());
    expect(cancelRun).toHaveBeenCalledWith('run-running');
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

    await vi.waitFor(() => expect(cancelRun).toHaveBeenCalledWith('run-running'));
    await act(async () => {});
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

describe('Runs — row navigation', () => {
  const selectedTestSuite = { id: 'suite-1' } as TestSuite;
  const runRefreshRef = { current: null };
  const CLICKED_RUN = { id: 'run-completed', status: RunStatus.COMPLETED };

  const renderRuns = () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
  };

  const clickCell = (field: string, event: Partial<MouseEvent> = {}) => {
    gridProps.additionalGridOptions?.onCellClicked?.({
      colDef: { field },
      data: CLICKED_RUN,
      node: { setSelected: vi.fn() },
      event,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRunsQuery).mockResolvedValue({ content: [], totalElements: 0 } as any);
  });

  test.each([{}, { ctrlKey: true }, { metaKey: true }])(
    'opens the run details in a new tab regardless of click modifiers (%o)',
    (modifier) => {
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      renderRuns();

      clickCell('testRunName', modifier);

      expect(open).toHaveBeenCalledWith(getUrnForEntity(ApplicationRoute.Runs, CLICKED_RUN), '_blank');
      open.mockRestore();
    },
  );

  test('navigates nowhere for a click in the actions column', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderRuns();

    clickCell(ACTIONS_COLUMN_CEL_ID);

    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

describe('Runs — first page loading', () => {
  const selectedTestSuite = { id: 'suite-1' } as TestSuite;
  const runRefreshRef: { current: (() => void) | null } = { current: null };
  const FIRST_PAGE = { content: MOCK_ROWS, totalElements: 6 } as Awaited<ReturnType<typeof getRunsQuery>>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRunsQuery).mockResolvedValue(FIRST_PAGE);
  });

  test('requests the first page once and hands it to the grid', async () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    const successCallback = await requestRowsAndWait();

    expect(successCallback).toHaveBeenCalledWith(expect.any(Array), 6);
    expect(getRunsQuery).toHaveBeenCalledOnce();
  });

  test('does not recreate the datasource when the first page arrives, so the grid is not loaded twice', async () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    const datasource = gridProps.datasource;
    requestRows();

    expect(await screen.findByText(`${TabsI18nKey.Runs}: 6`)).toBeInTheDocument();
    expect(gridProps.datasource).toBe(datasource);
  });

  test('reuses the shared first page when the grid asks for it again', async () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    await requestRowsAndWait();
    await requestRowsAndWait();

    expect(getRunsQuery).toHaveBeenCalledOnce();
  });

  test('queries again for a sorted request', async () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    await requestRowsAndWait({ sortModel: [{ colId: 'startedAt', sort: 'desc' }] });

    expect(getRunsQuery).toHaveBeenCalledOnce();
    expect(vi.mocked(getRunsQuery).mock.calls[0][2]).toHaveLength(1);
  });

  test('drops the shared first page and purges the grid on refresh', async () => {
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);
    await requestRowsAndWait();

    runRefreshRef.current?.();
    expect(mockGridApi.refreshInfiniteCache).toHaveBeenCalledOnce();

    await requestRowsAndWait();
    expect(getRunsQuery).toHaveBeenCalledTimes(2);
  });

  test('does not cache a failed first page', async () => {
    vi.mocked(getRunsQuery).mockResolvedValueOnce(null).mockResolvedValue(FIRST_PAGE);
    render(<Runs runRefreshRef={runRefreshRef} selectedTestSuite={selectedTestSuite} />);

    const firstAttempt = await requestRowsAndWait();
    expect(firstAttempt).toHaveBeenCalledWith([], 0);

    const secondAttempt = await requestRowsAndWait();
    expect(secondAttempt).toHaveBeenCalledWith(expect.any(Array), 6);
    expect(getRunsQuery).toHaveBeenCalledTimes(2);
  });
});

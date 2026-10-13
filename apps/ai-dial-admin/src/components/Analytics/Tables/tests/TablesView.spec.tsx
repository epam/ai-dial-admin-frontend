import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { listTableBackfillRuns } from '@/src/app/[lang]/tables/actions';
import TablesView from '@/src/components/Analytics/Tables/TablesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import {
  ActionMenuOperationI18nKey,
  AnalyticsTableAccessI18nKey,
  AnalyticsTablesI18nKey,
  BackfillI18nKey,
  ButtonsI18nKey,
} from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';
import { TableBackfillRun, TableBackfillState } from '@/src/models/analytics/table-backfill';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Mock the ellipsis tooltip so the delete confirmation's Name value is plain, assertable text.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

interface MockActionItem {
  id: string;
  onClick?: (entity?: AnalyticsTable) => void;
}

interface MockColDef {
  colId?: string;
  field?: string;
  cellRenderer?: (params: { data: AnalyticsTable }) => React.ReactNode;
  cellRendererParams?: { items?: MockActionItem[] };
}

const permissions = {
  canCreate: true,
  canDelete: true,
  canManageRoles: true,
  canWrite: true,
  canModify: true,
  canChangeSensitive: true,
  isRowsRestricted: false,
};

// The grid is a stand-in, so a cell renderer is reached through the column defs it was handed.
let lastColumnDefs: MockColDef[] = [];
vi.mock('@/src/hooks/use-analytics-table-permissions', () => ({
  useAnalyticsTablePermissions: () => permissions,
}));

// Row actions are rendered as buttons per row so tests can trigger Delete/Edit for a specific table.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: AnalyticsTable[]; columnDefs?: MockColDef[] }) => {
    lastColumnDefs = columnDefs ?? [];
    const items = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    return (
      <div>
        <div>catalog rows: {rowData?.length ?? 0}</div>
        <div>cols: {columnDefs?.map((c) => c.colId ?? c.field).join('|')}</div>
        <div>row actions: {items.map((i) => i.id).join('|')}</div>
        {rowData?.map((row) => (
          <div key={row.name}>
            {items.map((item) => (
              <button key={item.id} onClick={() => item.onClick?.(row)}>
                {item.id}:{row.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

const TABLES: AnalyticsTable[] = [
  { name: 'dial_usage_log', type: AnalyticsTableType.Source, status: TableStatus.Active },
  { name: 'rate_analytics', type: AnalyticsTableType.Source, status: TableStatus.Pending },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listTableBackfillRuns).mockResolvedValue({ success: true, response: [] });
  Object.assign(permissions, {
    canCreate: true,
    canDelete: true,
    canManageRoles: true,
    canWrite: true,
    canModify: true,
  });
});

describe('TablesView — Rows restricted badge', () => {
  const renderNameCell = (data: AnalyticsTable) => {
    render(<TablesView initialTables={TABLES} />);
    const nameColumn = lastColumnDefs.find((c) => c.field === 'name');

    return render(<>{nameColumn?.cellRenderer?.({ data })}</>);
  };

  test('shows the badge beside the name of a table that confines the viewer', () => {
    renderNameCell({ ...TABLES[0], permissions: { rows_restricted: true } as AnalyticsTable['permissions'] });

    expect(screen.getAllByText('dial_usage_log').length).toBeGreaterThan(0);
    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeInTheDocument();
  });

  test('shows no badge for a table that does not confine the viewer', () => {
    renderNameCell({ ...TABLES[0], permissions: { rows_restricted: false } as AnalyticsTable['permissions'] });

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeNull();
  });

  test('shows no badge for a table that reports no permissions', () => {
    renderNameCell(TABLES[0]);

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RowsRestricted)).toBeNull();
  });
});

describe('TablesView', () => {
  test('renders the server-provided catalog and one Create button for an admin', () => {
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText('catalog rows: 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.CreateSource })).toBeNull();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.CreateEnrichment })).toBeNull();
  });

  test('offers a source and an enrichment from the Create menu', async () => {
    const user = userEvent.setup();
    render(<TablesView initialTables={TABLES} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(await screen.findByText(AnalyticsTablesI18nKey.TypeSource)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.TypeEnrichment)).toBeInTheDocument();
  });

  test.each([
    [AnalyticsTablesI18nKey.TypeSource, AnalyticsTablesI18nKey.CreateSourceTitle],
    [AnalyticsTablesI18nKey.TypeEnrichment, AnalyticsTablesI18nKey.CreateEnrichmentTitle],
  ])('opens the create dialog for the kind chosen in the menu: %s', async (item, title) => {
    const user = userEvent.setup();
    render(<TablesView initialTables={TABLES} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
    await user.click(await screen.findByText(item));

    expect(await screen.findByText(title)).toBeInTheDocument();
  });

  test('offers no Create menu to a caller who cannot create', () => {
    permissions.canCreate = false;
    render(<TablesView initialTables={TABLES} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).toBeNull();
  });

  test('renders an empty catalog', () => {
    render(<TablesView initialTables={[]} />);

    expect(screen.getByText('catalog rows: 0')).toBeInTheDocument();
  });

  test('the grid includes a status column', () => {
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText(/^cols:/)).toHaveTextContent('status');
  });

  test('the grid includes a source-table column', () => {
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText(/^cols:/)).toHaveTextContent('source_table');
  });

  test('the row action menu offers Edit and Delete', () => {
    render(<TablesView initialTables={TABLES} />);

    const rowActions = screen.getByText(/^row actions:/);
    expect(rowActions).toHaveTextContent(ActionMenuOperationI18nKey.Edit);
    expect(rowActions).toHaveTextContent(ActionMenuOperationI18nKey.Delete);
  });

  test('hides the create buttons when the user cannot create', () => {
    permissions.canCreate = false;
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText('catalog rows: 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.CreateSource })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.CreateEnrichment })).not.toBeInTheDocument();
  });

  test('the delete confirmation names the table being deleted', async () => {
    const user = userEvent.setup();
    render(<TablesView initialTables={TABLES} />);

    await user.click(screen.getByRole('button', { name: `${ActionMenuOperationI18nKey.Delete}:rate_analytics` }));

    const dialog = within(screen.getByRole('dialog', { name: AnalyticsTablesI18nKey.DeleteConfirmTitle }));
    expect(dialog.getByText(new RegExp(`^${AnalyticsTablesI18nKey.Name}`))).toBeInTheDocument();
    expect(dialog.getByText('rate_analytics')).toBeInTheDocument();
  });
});

describe('TablesView — Backfill data', () => {
  const runningRun: TableBackfillRun = {
    runId: 'run-1',
    from: '2026-09-01',
    to: '2026-09-30',
    daysTotal: 30,
    state: TableBackfillState.Running,
    daysCompleted: 11,
    daysFailed: 0,
    filesProcessed: 10,
    rowsInserted: 100,
    rowsSkipped: 0,
    rowsDropped: 0,
    startedAt: '2026-09-24T10:00:00Z',
  };

  afterEach(() => {
    Object.assign(useAppContext(), { isFullAdmin: true });
  });

  test('offers the button to a full admin when no run is in progress', async () => {
    render(<TablesView initialTables={TABLES} />);

    expect(await screen.findByRole('button', { name: BackfillI18nKey.TableTitle })).toBeInTheDocument();
    expect(screen.queryByText(BackfillI18nKey.BannerTable)).toBeNull();
  });

  test('withholds the button and the banner from a caller who is not a full admin, and asks nothing', async () => {
    Object.assign(useAppContext(), { isFullAdmin: false });
    permissions.canCreate = true;
    vi.mocked(listTableBackfillRuns).mockResolvedValue({ success: true, response: [runningRun] });

    render(<TablesView initialTables={TABLES} />);

    expect(screen.queryByRole('button', { name: BackfillI18nKey.TableTitle })).toBeNull();
    expect(screen.queryByText(BackfillI18nKey.BannerTable)).toBeNull();
    expect(listTableBackfillRuns).not.toHaveBeenCalled();
  });

  test('states a run in progress above the listing and withholds the button', async () => {
    vi.mocked(listTableBackfillRuns).mockResolvedValue({ success: true, response: [runningRun] });

    render(<TablesView initialTables={TABLES} />);

    expect(await screen.findByText(BackfillI18nKey.BannerTable)).toBeInTheDocument();
    expect(screen.getByText(BackfillI18nKey.BannerTableStarted)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BackfillI18nKey.TableTitle })).toBeNull();
  });

  test('asks only for runs that are running, so a finished run shows no banner', async () => {
    render(<TablesView initialTables={TABLES} />);

    await waitFor(() => expect(listTableBackfillRuns).toHaveBeenCalledWith(TableBackfillState.Running));
    expect(screen.queryByText(BackfillI18nKey.BannerTable)).toBeNull();
  });

  test('shows no banner when the read fails', async () => {
    vi.mocked(listTableBackfillRuns).mockResolvedValue({ success: false, errorMessage: 'unavailable' });

    render(<TablesView initialTables={TABLES} />);

    await waitFor(() => expect(listTableBackfillRuns).toHaveBeenCalled());
    expect(screen.queryByText(BackfillI18nKey.BannerTable)).toBeNull();
  });

  test('reads the run again while it runs and drops the banner once it has finished', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      vi.mocked(listTableBackfillRuns)
        .mockResolvedValueOnce({ success: true, response: [runningRun] })
        .mockResolvedValue({ success: true, response: [] });
      render(<TablesView initialTables={TABLES} />);
      await screen.findByText(BackfillI18nKey.BannerTable);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });

      await waitFor(() => expect(screen.queryByText(BackfillI18nKey.BannerTable)).toBeNull());
      expect(await screen.findByRole('button', { name: BackfillI18nKey.TableTitle })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test('is closed until it is asked for', async () => {
    render(<TablesView initialTables={TABLES} />);

    await screen.findByRole('button', { name: BackfillI18nKey.TableTitle });

    expect(screen.queryByRole('dialog', { name: BackfillI18nKey.TableTitle })).toBeNull();
  });

  test('opens the backfill drawer from the button', async () => {
    const user = userEvent.setup();
    render(<TablesView initialTables={TABLES} />);

    await user.click(await screen.findByRole('button', { name: BackfillI18nKey.TableTitle }));

    expect(await screen.findByRole('dialog', { name: BackfillI18nKey.TableTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeInTheDocument();
  });

  test('opens the backfill drawer from the banner', async () => {
    const user = userEvent.setup();
    vi.mocked(listTableBackfillRuns).mockResolvedValue({ success: true, response: [runningRun] });
    render(<TablesView initialTables={TABLES} />);

    await user.click(await screen.findByRole('button', { name: BackfillI18nKey.ViewRun }));

    expect(await screen.findByRole('dialog', { name: BackfillI18nKey.TableTitle })).toBeInTheDocument();
  });

  test('closes the backfill drawer through its close control', async () => {
    const user = userEvent.setup();
    render(<TablesView initialTables={TABLES} />);
    await user.click(await screen.findByRole('button', { name: BackfillI18nKey.TableTitle }));

    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Close }));

    expect(screen.queryByRole('dialog', { name: BackfillI18nKey.TableTitle })).toBeNull();
  });

  test('closes the backfill drawer when the page around it is pressed', async () => {
    const user = userEvent.setup();
    render(<TablesView initialTables={TABLES} />);
    await user.click(await screen.findByRole('button', { name: BackfillI18nKey.TableTitle }));

    fireEvent.mouseDown(
      (await screen.findByRole('dialog', { name: BackfillI18nKey.TableTitle })).parentElement as HTMLElement,
    );

    expect(screen.queryByRole('dialog', { name: BackfillI18nKey.TableTitle })).toBeNull();
  });
});

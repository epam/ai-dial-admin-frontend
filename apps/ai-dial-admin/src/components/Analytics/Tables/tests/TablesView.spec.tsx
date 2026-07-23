import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TablesView from '@/src/components/Analytics/Tables/TablesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ActionMenuOperationI18nKey, AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';

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
  cellRendererParams?: { items?: MockActionItem[] };
}

const permissions = { canCreate: true, canDelete: true, canManageRoles: true, canWrite: true, canModify: true };
vi.mock('@/src/hooks/use-analytics-table-permissions', () => ({
  useAnalyticsTablePermissions: () => permissions,
}));

// Row actions are rendered as buttons per row so tests can trigger Delete/Edit for a specific table.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: AnalyticsTable[]; columnDefs?: MockColDef[] }) => {
    const items = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    return (
      <div>
        <div>catalog rows: {rowData?.length ?? 0}</div>
        <div>cols: {columnDefs?.map((c) => c.colId).join('|')}</div>
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
  Object.assign(permissions, {
    canCreate: true,
    canDelete: true,
    canManageRoles: true,
    canWrite: true,
    canModify: true,
  });
});

describe('TablesView', () => {
  test('renders the server-provided catalog and the create buttons for an admin', () => {
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText('catalog rows: 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.CreateSource })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.CreateEnrichment })).toBeInTheDocument();
  });

  test('renders an empty catalog', () => {
    render(<TablesView initialTables={[]} />);

    expect(screen.getByText('catalog rows: 0')).toBeInTheDocument();
  });

  test('the grid includes a status column', () => {
    render(<TablesView initialTables={TABLES} />);

    expect(screen.getByText(/^cols:/)).toHaveTextContent('status');
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

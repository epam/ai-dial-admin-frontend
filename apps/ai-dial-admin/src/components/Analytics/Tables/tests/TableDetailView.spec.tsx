import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable } from '@/src/app/[lang]/tables/actions';
import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType, PartitionGranularity, TableStatus } from '@/src/models/analytics/table';

// Monaco is heavy and not meaningful in jsdom — assert on the value/onChange contract instead.
vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value, onChange }: { value?: string; onChange: (v?: string) => void }) => (
    <textarea aria-label="rows-json" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Mock the "Add" button dropdown so its collapsed items are queryable/clickable as buttons, and the
// ellipsis tooltip so the delete confirmation's Name value is plain, assertable text.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialButtonDropdown: ({ label, items }: any) => (
      <div>
        <span>{label}</span>
        {items?.map((item: any) => (
          <button key={item.key} onClick={() => item.onClick?.({ key: item.key })}>
            {item.label}
          </button>
        ))}
      </div>
    ),
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

const permissions = { canCreate: true, canDelete: true, canManageRoles: true, canWrite: true, canModify: true };
vi.mock('@/src/hooks/use-analytics-table-permissions', () => ({
  useAnalyticsTablePermissions: () => permissions,
}));

// Panel loads server data on mount — stub it; its own behavior is covered in TableAccessPanel.spec.
vi.mock('@/src/components/Analytics/Tables/TableAccessPanel', () => ({ default: () => <div>access panel</div> }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    columnDefs,
    additionalGridOptions,
  }: {
    rowData?: unknown[];
    columnDefs?: { headerName?: string }[];
    additionalGridOptions?: { pinnedTopRowData?: { name: string; type: string; tag?: string }[] };
  }) => (
    <div>
      <div>headers: {columnDefs?.map((c) => c.headerName).join('|')}</div>
      <div>columns: {rowData?.length ?? 0}</div>
      <div>pinned: {additionalGridOptions?.pinnedTopRowData?.map((r) => r.name).join('|') ?? 'none'}</div>
      <div>
        pinned type/tag:{' '}
        {additionalGridOptions?.pinnedTopRowData?.map((r) => `${r.type || '(none)'}/${r.tag || '(none)'}`).join('|') ??
          'none'}
      </div>
    </div>
  ),
}));

// The draft-schema surface's own behavior (completeness gating, column/key controls) is covered in
// DraftSchemaEditor.spec.tsx; here we only assert TableDetailView renders it for a non-active table.
vi.mock('@/src/components/Analytics/Tables/DraftSchemaEditor', () => ({
  default: () => <div>draft-schema-editor</div>,
}));

// Defaults to ACTIVE so the permission-gating tests below exercise the live (add-rows/add-columns) surface;
// the lifecycle-status tests at the bottom override `status` explicitly.
const table = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  status: TableStatus.Active,
  columns: [],
  ...overrides,
});

const setPerms = (over: Partial<typeof permissions>) =>
  Object.assign(
    permissions,
    { canCreate: false, canDelete: false, canManageRoles: false, canWrite: false, canModify: false },
    over,
  );

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(permissions, {
    canCreate: true,
    canDelete: true,
    canManageRoles: true,
    canWrite: true,
    canModify: true,
  });
  // An enrichment table looks up its source table (see TableDetailView's grain-key-metadata effect);
  // default to none found so tests that don't care about it aren't broken by an unhandled promise.
  vi.mocked(getTable).mockResolvedValue(null);
});

describe('TableDetailView action gating', () => {
  test('an admin with full permissions collapses Add columns/Add rows into one Add dropdown', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
  });

  test('the toolbar renders in Manage roles, Delete, Add order', () => {
    const { container } = render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    const text = container.textContent ?? '';
    expect(text.indexOf(AnalyticsTablesI18nKey.ManageAccess)).toBeLessThan(
      text.indexOf(AnalyticsTablesI18nKey.DeleteTable),
    );
    expect(text.indexOf(AnalyticsTablesI18nKey.DeleteTable)).toBeLessThan(text.indexOf(ButtonsI18nKey.Add));
  });

  test('write-only capability shows Add rows but not schema/delete actions', () => {
    setPerms({ canWrite: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('modify-only capability shows Add columns but not Add rows', () => {
    setPerms({ canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
  });

  test('delete is hidden when the user cannot delete even with edit permissions', () => {
    setPerms({ canWrite: true, canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('a fully-denied user (e.g. a system table) sees no actions but keeps the read-only badge', () => {
    setPerms({});
    render(<TableDetailView name="dial_usage_log" initialTable={table({ system: true })} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.SystemReadOnly)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
  });

  test('the role-management action is hidden when the user cannot manage roles', () => {
    setPerms({ canWrite: true, canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
  });

  test('the delete confirmation names the table being deleted', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable }));

    const dialog = within(screen.getByRole('dialog', { name: AnalyticsTablesI18nKey.DeleteConfirmTitle }));
    expect(dialog.getByText(new RegExp(`^${AnalyticsTablesI18nKey.Name}`))).toBeInTheDocument();
    expect(dialog.getByText('dial_usage_log')).toBeInTheDocument();
  });
});

describe('TableDetailView header', () => {
  test('shows the table description under the name and status badge', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ description: 'Raw usage events ingested from blob storage.' })}
      />,
    );

    expect(screen.getByText('Raw usage events ingested from blob storage.')).toBeInTheDocument();
  });
});

describe('TableDetailView columns grid', () => {
  test('the grid includes Display name and Description columns', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    const headers = screen.getByText(/^headers:/);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.DisplayName);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.Description);
  });
});

describe('TableDetailView schema metadata', () => {
  test('an active source table shows its ordering key, partition column, and granularity', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({
          ordering_key: ['event_id', 'request_time'],
          partition_by: { column: 'request_time', granularity: PartitionGranularity.Day },
        })}
      />,
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
    expect(screen.getByText('event_id, request_time')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.PartitionColumn)).toBeInTheDocument();
    expect(screen.getByText('request_time')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.Granularity)).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  test('an active source table with no partition hides partition column and granularity', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ ordering_key: ['event_id'] })} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.PartitionColumn)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.Granularity)).not.toBeInTheDocument();
  });

  test('an active enrichment table shows its grain key', () => {
    render(
      <TableDetailView
        name="order_flags"
        initialTable={table({
          name: 'order_flags',
          type: AnalyticsTableType.Enrichment,
          source_table: 'orders',
          grain: { grain_key: 'order_id' },
        })}
      />,
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.GrainKey)).toBeInTheDocument();
    expect(screen.getByText('order_id')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
  });

  test('an active enrichment table pins its grain key as a read-only row atop the columns grid', () => {
    render(
      <TableDetailView
        name="order_flags"
        initialTable={table({
          name: 'order_flags',
          type: AnalyticsTableType.Enrichment,
          source_table: 'orders',
          grain: { grain_key: 'order_id' },
        })}
      />,
    );

    expect(screen.getByText('pinned: order_id')).toBeInTheDocument();
  });

  test("backfills the pinned grain-key row's type and tag from the matching column on the source table", async () => {
    vi.mocked(getTable).mockResolvedValue(
      table({
        name: 'orders',
        columns: [{ source_name: 'order_id', name: 'order_id', type: AnalyticsFieldType.Uuid, tag: 'identity' }],
      }),
    );

    render(
      <TableDetailView
        name="order_flags"
        initialTable={table({
          name: 'order_flags',
          type: AnalyticsTableType.Enrichment,
          source_table: 'orders',
          grain: { grain_key: 'order_id' },
        })}
      />,
    );

    expect(await screen.findByText('pinned type/tag: uuid/identity')).toBeInTheDocument();
  });

  test('falls back to a bare name when the grain key no longer matches any source column', async () => {
    vi.mocked(getTable).mockResolvedValue(table({ name: 'orders', columns: [] }));

    render(
      <TableDetailView
        name="order_flags"
        initialTable={table({
          name: 'order_flags',
          type: AnalyticsTableType.Enrichment,
          source_table: 'orders',
          grain: { grain_key: 'stale_column' },
        })}
      />,
    );

    expect(await screen.findByText('pinned: stale_column')).toBeInTheDocument();
    expect(screen.getByText('pinned type/tag: (none)/(none)')).toBeInTheDocument();
  });

  test('a source table has no pinned grid row', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByText('pinned: none')).toBeInTheDocument();
  });

  test('a PENDING table does not show the read-only metadata row (the draft editor covers it)', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Pending, ordering_key: ['event_id'] })}
      />,
    );

    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
  });
});

describe('TableDetailView write rows', () => {
  test('opening Add rows prefills the JSON editor with a template keyed by source_name (the physical column), not a renamed exposed name', async () => {
    const user = userEvent.setup();
    const columns = [
      { source_name: 'event_id', name: 'event', type: AnalyticsFieldType.Uuid },
      { source_name: 'total_money', name: 'total_money', type: AnalyticsFieldType.Decimal },
    ];
    render(<TableDetailView name="dial_usage_log" initialTable={table({ columns })} />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows }));

    const editor = screen.getByLabelText('rows-json') as HTMLTextAreaElement;
    expect(JSON.parse(editor.value)).toEqual([{ event_id: '', total_money: 0 }]);
  });

  test('for an enrichment table, the template includes the (hidden) grain key as a leading field', async () => {
    const user = userEvent.setup();
    const columns = [{ source_name: 'flag', name: 'flag', type: AnalyticsFieldType.Boolean }];
    render(
      <TableDetailView
        name="order_flags"
        initialTable={table({
          name: 'order_flags',
          type: AnalyticsTableType.Enrichment,
          source_table: 'orders',
          grain: { grain_key: 'order_id' },
          columns,
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows }));

    const editor = screen.getByLabelText('rows-json') as HTMLTextAreaElement;
    expect(JSON.parse(editor.value)).toEqual([{ order_id: '', flag: false }]);
  });

  test('Insert rows is disabled while the JSON is invalid and re-enables once it is a valid array', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows }));
    const editor = screen.getByLabelText('rows-json');
    const insertButton = screen.getByRole('button', { name: AnalyticsTablesI18nKey.InsertRows });

    fireEvent.change(editor, { target: { value: '{ "a": ' } });
    expect(insertButton).toBeDisabled();

    fireEvent.change(editor, { target: { value: '{"a": 1}' } });
    expect(insertButton).toBeDisabled();

    fireEvent.change(editor, { target: { value: '[]' } });
    expect(insertButton).toBeEnabled();
  });
});

describe('TableDetailView lifecycle status', () => {
  test('an ACTIVE table shows the live grid and add-rows/add-columns actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Active })} />);

    expect(screen.getByText(/^columns:/)).toBeInTheDocument();
    expect(screen.queryByText('draft-schema-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
  });

  test('a PENDING table shows the draft schema editor and hides add-rows/add-columns actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Pending })} />);

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
    expect(screen.queryByText(/^columns:/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
  });

  test('a FAILED table also shows the draft schema editor', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Failed })} />);

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
  });

  test('the status badge reflects the table status', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Pending })} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.StatusPending)).toBeInTheDocument();
  });

  test('a PENDING table shows a header Save action, disabled until the draft is complete', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Pending })} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });
});

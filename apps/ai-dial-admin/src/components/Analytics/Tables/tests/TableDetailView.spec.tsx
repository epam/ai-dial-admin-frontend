import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTableAccess, updateTableSchema } from '@/src/app/[lang]/tables/actions';
import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { ActionMenuOperationI18nKey, AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
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

// Mock the ellipsis tooltip so the delete confirmation's Name value is plain, assertable text.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
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
    rowData?: { name: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columnDefs?: { headerName?: string; cellRendererParams?: { items?: any[] } }[];
    additionalGridOptions?: { pinnedTopRowData?: { name: string; type: string; tag?: string }[] };
  }) => {
    const items = columnDefs?.find((c) => c.cellRendererParams?.items)?.cellRendererParams?.items ?? [];
    return (
      <div>
        <div>headers: {columnDefs?.map((c) => c.headerName).join('|')}</div>
        <div>columns: {rowData?.length ?? 0}</div>
        <div>pinned: {additionalGridOptions?.pinnedTopRowData?.map((r) => r.name).join('|') ?? 'none'}</div>
        <div>
          pinned type/tag:{' '}
          {additionalGridOptions?.pinnedTopRowData
            ?.map((r) => `${r.type || '(none)'}/${r.tag || '(none)'}`)
            .join('|') ?? 'none'}
        </div>
        {rowData?.map((row) => (
          <div key={row.name} aria-label={`row-${row.name}`}>
            {items
              .filter((item) => !item.hidden?.({}, { data: row }))
              .map((item) => (
                <button key={item.id} onClick={() => item.onClick?.(row)}>
                  {`${row.name}:${item.label}`}
                </button>
              ))}
          </div>
        ))}
      </div>
    );
  },
}));

// The popup's own behavior is covered in EditColumnPopup.spec.tsx; here we only assert which column it
// opens for and the guard props it receives.
vi.mock('@/src/components/Analytics/Tables/EditColumnPopup', () => ({
  default: ({ column, renameDisabled, sensitiveDisabled }: any) => (
    <div>
      {`edit-popup: ${column.name} rename-disabled: ${Boolean(renameDisabled)} sensitive-disabled: ${Boolean(
        sensitiveDisabled,
      )}`}
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
  // The Connect panel reads the table's access lists on open; default to none so tests that only
  // exercise the header aren't tripped by an unhandled promise.
  vi.mocked(getTableAccess).mockResolvedValue({ write: [], modify: [] });
});

describe('TableDetailView action gating', () => {
  test('an admin with full permissions gets Add columns and Add rows as separate buttons, with no dropdown', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.queryByText(ButtonsI18nKey.Add)).not.toBeInTheDocument();
  });

  test('the toolbar renders in Manage access, Delete, Add columns, Add rows, Connect order', () => {
    const { container } = render(
      <TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />,
    );

    const text = container.textContent ?? '';
    const order = [
      AnalyticsTablesI18nKey.ManageAccess,
      AnalyticsTablesI18nKey.DeleteTable,
      AnalyticsTablesI18nKey.AddColumns,
      AnalyticsTablesI18nKey.AddRows,
      AnalyticsTablesI18nKey.Connect,
    ].map((key) => text.indexOf(key));

    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((index) => index >= 0)).toBe(true);
  });

  test('Connect is offered on an active table whatever the viewer may do to it', () => {
    setPerms({});
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.Connect })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
  });

  test('a system table still offers Connect while every mutating action is absent', () => {
    setPerms({});
    render(<TableDetailView name="dial_usage_log" initialTable={table({ system: true })} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.Connect })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('a not-yet-active table shows Save in place of Connect and the Add buttons', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Pending })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.Connect })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
  });

  test('write-only capability shows Add rows but not schema/delete actions', () => {
    setPerms({ canWrite: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('modify-only capability shows Add columns but not Add rows', () => {
    setPerms({ canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
  });

  test('delete is hidden when the user cannot delete even with edit permissions', () => {
    setPerms({ canWrite: true, canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('a fully-denied user (e.g. a system table) sees no actions but keeps the read-only badge', () => {
    setPerms({});
    render(<TableDetailView name="dial_usage_log" initialTable={table({ system: true })} apiBaseUrl="" flightUri="" />);

    expect(screen.getByText(AnalyticsTablesI18nKey.SystemReadOnly)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
  });

  test('the role-management action is hidden when the user cannot manage roles', () => {
    setPerms({ canWrite: true, canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
  });

  test('the delete confirmation names the table being deleted', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

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
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText('Raw usage events ingested from blob storage.')).toBeInTheDocument();
  });
});

describe('TableDetailView columns grid', () => {
  test('the grid includes Display name and Description columns', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

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
        apiBaseUrl=""
        flightUri=""
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
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ ordering_key: ['event_id'] })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.PartitionColumn)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.Granularity)).not.toBeInTheDocument();
  });

  test('an active source table shows its declared scan-metadata pair', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({
          // Distinct from both pair values so each assertion below matches exactly one node.
          ordering_key: ['total'],
          identity_column: 'event_id',
          version_column: 'request_time',
        })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.IdentityColumn)).toBeInTheDocument();
    expect(screen.getByText('event_id')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.VersionColumn)).toBeInTheDocument();
    expect(screen.getByText('request_time')).toBeInTheDocument();
  });

  test('a source declaring no scan metadata shows neither label and no substitute message', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ ordering_key: ['event_id'] })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.queryByText(AnalyticsTablesI18nKey.IdentityColumn)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.VersionColumn)).not.toBeInTheDocument();
  });

  test('a source declaring only one member shows that one and omits the other', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ ordering_key: ['event_id'], version_column: 'request_time' })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.VersionColumn)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.IdentityColumn)).not.toBeInTheDocument();
  });

  test('a system scan-metadata column absent from the columns grid still renders in the summary', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({
          ordering_key: ['event_id'],
          identity_column: 'event_id',
          // A `_`-prefixed system column: legitimately not among `columns`.
          version_column: '_ingested_at',
          columns: [{ source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid }],
        })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText('_ingested_at')).toBeInTheDocument();
    expect(screen.getByText('columns: 1')).toBeInTheDocument();
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
        apiBaseUrl=""
        flightUri=""
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
        apiBaseUrl=""
        flightUri=""
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
        apiBaseUrl=""
        flightUri=""
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
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(await screen.findByText('pinned: stale_column')).toBeInTheDocument();
    expect(screen.getByText('pinned type/tag: (none)/(none)')).toBeInTheDocument();
  });

  test('a source table has no pinned grid row', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByText('pinned: none')).toBeInTheDocument();
  });

  test('a PENDING table does not show the read-only metadata row (the draft editor covers it)', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Pending, ordering_key: ['event_id'] })}
        apiBaseUrl=""
        flightUri=""
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
    render(<TableDetailView name="dial_usage_log" initialTable={table({ columns })} apiBaseUrl="" flightUri="" />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows }));

    const editor = screen.getByLabelText('rows-json') as HTMLTextAreaElement;
    expect(JSON.parse(editor.value)).toEqual([{ event_id: '', total_money: 0 }]);
  });

  test('Insert rows is disabled while the JSON is invalid and re-enables once it is a valid array', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

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

describe('TableDetailView add columns :: display name and description', () => {
  // The header trigger and the popup's submit share the "Add columns" label, so every query below is
  // scoped to the popup itself.
  const openPopup = async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);
    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns }));
    return { user, popup: within(screen.getByRole('dialog')) };
  };

  test('the popup offers a Display name and a Description field on its column row', async () => {
    const { popup } = await openPopup();

    expect(popup.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false })).toBeInTheDocument();
    expect(popup.getByLabelText(AnalyticsTablesI18nKey.Description, { exact: false })).toBeInTheDocument();
  });

  // The point of the change: metadata authored here reaches the backend in the same request that creates
  // the column, so no follow-up trip through the edit modal is needed.
  test('a column added with metadata sends display_name and description in the add patch', async () => {
    vi.mocked(updateTableSchema).mockResolvedValue({ success: true });
    const { user, popup } = await openPopup();

    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.ColumnName, { exact: false }), {
      target: { value: 'total_tokens' },
    });
    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false }), {
      target: { value: 'Total tokens' },
    });
    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.Description, { exact: false }), {
      target: { value: 'Prompt plus completion tokens' },
    });
    await user.click(popup.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns }));

    expect(updateTableSchema).toHaveBeenCalledWith('dial_usage_log', {
      add: [
        expect.objectContaining({
          source_name: 'total_tokens',
          name: 'total_tokens',
          display_name: 'Total tokens',
          description: 'Prompt plus completion tokens',
        }),
      ],
    });
  });

  test('a column added without metadata sends neither key', async () => {
    vi.mocked(updateTableSchema).mockResolvedValue({ success: true });
    const { user, popup } = await openPopup();

    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.ColumnName, { exact: false }), {
      target: { value: 'total_tokens' },
    });
    await user.click(popup.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns }));

    const patch = vi.mocked(updateTableSchema).mock.lastCall?.[1];
    expect(patch?.add?.[0]).not.toHaveProperty('display_name');
    expect(patch?.add?.[0]).not.toHaveProperty('description');
  });

  test('an over-cap display name or description disables submit', async () => {
    const { popup } = await openPopup();
    const submit = popup.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns });

    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.ColumnName, { exact: false }), {
      target: { value: 'total_tokens' },
    });
    expect(submit).toBeEnabled();

    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false }), {
      target: { value: 'a'.repeat(129) },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false }), {
      target: { value: 'Total tokens' },
    });
    expect(submit).toBeEnabled();

    fireEvent.change(popup.getByLabelText(AnalyticsTablesI18nKey.Description, { exact: false }), {
      target: { value: 'b'.repeat(1025) },
    });
    expect(submit).toBeDisabled();
  });
});

describe('TableDetailView enrichment tables', () => {
  const enrichment = () =>
    table({ type: AnalyticsTableType.Enrichment, source_table: 'dial_usage_log', grain: { grain_key: 'event_id' } });

  test('offers Connect but not Add rows — the enrichment process writes these, but they are readable through the source table', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={enrichment()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.Connect })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
  });

  test('offers no Connect when the payload names no source table, since no runnable query exists', () => {
    const orphan = table({ type: AnalyticsTableType.Enrichment, grain: { grain_key: 'event_id' } });
    render(<TableDetailView name="dial_usage_log" initialTable={orphan} apiBaseUrl="" flightUri="" />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.Connect })).not.toBeInTheDocument();
  });

  test('still offers the schema and catalog actions, which do apply', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={enrichment()} apiBaseUrl="" flightUri="" />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).toBeInTheDocument();
  });
});

describe('TableDetailView write rows :: framing and escalation', () => {
  test('the popup says what it is for before the editor, so a reader is redirected before typing', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows }));

    const purpose = screen.getByText(AnalyticsTablesI18nKey.AddRowsPurpose);
    const editor = screen.getByLabelText('rows-json');
    expect(purpose.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('Write rows programmatically closes the popup and opens the Connect panel on Write data', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows }));
    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.WriteProgrammatically }));

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.InsertRows })).not.toBeInTheDocument();
    expect(await screen.findByText(AnalyticsTablesI18nKey.ConnectWhoCanWrite)).toBeInTheDocument();
  });

  test('the Connect header button opens the panel on Write data', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={table()} apiBaseUrl="" flightUri="" />);

    await user.click(screen.getByRole('button', { name: AnalyticsTablesI18nKey.Connect }));

    expect(await screen.findByText(AnalyticsTablesI18nKey.ConnectWhoCanWrite)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectWhoCanRead)).not.toBeInTheDocument();
  });
});

describe('TableDetailView lifecycle status', () => {
  test('an ACTIVE table shows the live grid and add-rows/add-columns actions', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Active })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText(/^columns:/)).toBeInTheDocument();
    expect(screen.queryByText('draft-schema-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
  });

  test('a PENDING table shows the draft schema editor and hides add-rows/add-columns actions', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Pending })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
    expect(screen.queryByText(/^columns:/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
  });

  test('a FAILED table also shows the draft schema editor', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Failed })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
  });

  test('the status badge reflects the table status', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Pending })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.StatusPending)).toBeInTheDocument();
  });

  test('a PENDING table shows a header Save action, disabled until the draft is complete', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({ status: TableStatus.Pending })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });
});

describe('TableDetailView scan-metadata column guards', () => {
  // The ordering key deliberately excludes both pair columns: an ordering-key column is rename-restricted for
  // its own reason, which would mask whether the pair alone restricts a rename (it must not).
  const scannable = () =>
    table({
      ordering_key: ['total'],
      identity_column: 'event_id',
      version_column: 'request_time',
      columns: [
        { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid },
        { source_name: 'request_time', name: 'request_time', type: AnalyticsFieldType.Timestamp },
        { source_name: 'total', name: 'total', type: AnalyticsFieldType.Decimal },
      ],
    });

  test('offers no delete action for either scan-metadata column, but keeps it for the others', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={scannable()} apiBaseUrl="" flightUri="" />);

    expect(
      screen.queryByRole('button', { name: `event_id:${ActionMenuOperationI18nKey.Delete}` }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `request_time:${ActionMenuOperationI18nKey.Delete}` }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `total:${ActionMenuOperationI18nKey.Delete}` })).toBeInTheDocument();
  });

  test('still offers the edit action for a scan-metadata column, with the sensitive guard set', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={scannable()} apiBaseUrl="" flightUri="" />);

    await user.click(screen.getByRole('button', { name: `event_id:${ActionMenuOperationI18nKey.Edit}` }));

    // Renaming stays allowed — the backend repoints the stored pair — while `sensitive: true` is refused.
    expect(screen.getByText(/edit-popup: event_id/)).toBeInTheDocument();
    expect(screen.getByText(/rename-disabled: false/)).toBeInTheDocument();
    expect(screen.getByText(/sensitive-disabled: true/)).toBeInTheDocument();
  });

  test('leaves both guards off for a column outside the pair', async () => {
    const user = userEvent.setup();
    render(<TableDetailView name="dial_usage_log" initialTable={scannable()} apiBaseUrl="" flightUri="" />);

    await user.click(screen.getByRole('button', { name: `total:${ActionMenuOperationI18nKey.Edit}` }));

    expect(screen.getByText(/sensitive-disabled: false/)).toBeInTheDocument();
  });

  test('a column matching neither member keeps its delete action when the table declares no pair', () => {
    render(
      <TableDetailView
        name="dial_usage_log"
        initialTable={table({
          columns: [{ source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid }],
        })}
        apiBaseUrl=""
        flightUri=""
      />,
    );

    expect(screen.getByRole('button', { name: `event_id:${ActionMenuOperationI18nKey.Delete}` })).toBeInTheDocument();
  });
});

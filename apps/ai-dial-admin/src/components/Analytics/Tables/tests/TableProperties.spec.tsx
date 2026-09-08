import { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TableProperties from '@/src/components/Analytics/Tables/TableProperties';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType, PartitionGranularity, TableStatus } from '@/src/models/analytics/table';

// Mock the ellipsis tooltip so labelled values are plain, assertable text.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

// Exposes the parts of the grid contract TableProperties owns: the header set, the row data, the pinned
// row, whether the name cell is editable and the action column is present, and a trigger for the
// cell-value-changed handler that carries the inline rename.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    columnDefs,
    additionalGridOptions,
  }: {
    rowData?: { name: string }[];
    columnDefs?: {
      headerName?: string;
      editable?: (params: { node: { rowPinned: string | null } }) => boolean;
      cellRendererParams?: { items?: unknown[] };
    }[];
    additionalGridOptions?: {
      pinnedTopRowData?: { name: string; type: string; tag?: string }[];
      onCellValueChanged?: (event: { colDef: { field: string }; oldValue: string; newValue: string }) => void;
    };
  }) => {
    const nameColumn = columnDefs?.[0];
    const onCellValueChanged = additionalGridOptions?.onCellValueChanged;
    return (
      <div>
        <div>headers: {columnDefs?.map((c) => c.headerName).join('|')}</div>
        <div>columns: {rowData?.length ?? 0}</div>
        <div>pinned: {additionalGridOptions?.pinnedTopRowData?.map((r) => r.name).join('|') ?? 'none'}</div>
        <div>name editable: {String(Boolean(nameColumn?.editable?.({ node: { rowPinned: null } })))}</div>
        <div>action column: {String(columnDefs?.some((c) => !!c.cellRendererParams?.items))}</div>
        <button
          onClick={() => onCellValueChanged?.({ colDef: { field: 'name' }, oldValue: 'total', newValue: 'total_usd' })}
        >
          commit name edit
        </button>
        <button onClick={() => onCellValueChanged?.({ colDef: { field: 'tag' }, oldValue: 'old', newValue: 'new' })}>
          commit tag edit
        </button>
      </div>
    );
  },
}));

// The draft-schema surface's own behavior (completeness gating, column/key controls) is covered in
// DraftSchemaEditor.spec.tsx; here we only assert TableProperties renders it for a non-active table.
vi.mock('@/src/components/Analytics/Tables/DraftSchemaEditor', () => ({
  default: () => <div>draft-schema-editor</div>,
}));

const table = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  status: TableStatus.Active,
  columns: [],
  ...overrides,
});

// TableProperties only forwards `draft` to the mocked DraftSchemaEditor, so a bare stub is enough here;
// the form's own behavior is covered by use-draft-schema-form's and DraftSchemaEditor's specs.
const draftStub = {} as ReturnType<typeof useDraftSchemaForm>;

const renderProperties = (tbl: AnalyticsTable, props?: Partial<ComponentProps<typeof TableProperties>>) =>
  render(
    <TableProperties
      table={tbl}
      grainKeyRow={null}
      draft={draftStub}
      actions={[]}
      canModify
      onRenameCell={vi.fn()}
      {...props}
    />,
  );

describe('TableProperties columns grid', () => {
  test('the grid includes Display name and Description columns', () => {
    renderProperties(table());

    const headers = screen.getByText(/^headers:/);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.DisplayName);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.Description);
  });

  test('pins the grain-key row it is given atop the grid', () => {
    renderProperties(table({ name: 'order_flags', type: AnalyticsTableType.Enrichment, source_table: 'orders' }), {
      grainKeyRow: { source_name: 'order_id', name: 'order_id', type: AnalyticsFieldType.Uuid },
    });

    expect(screen.getByText('pinned: order_id')).toBeInTheDocument();
  });

  test('offers an editable name cell and the action column to a viewer who may modify the table', () => {
    renderProperties(table());

    expect(screen.getByText('name editable: true')).toBeInTheDocument();
    expect(screen.getByText('action column: true')).toBeInTheDocument();
  });

  test('offers neither an editable name cell nor the action column to a viewer who may not modify it', () => {
    renderProperties(table(), { canModify: false });

    expect(screen.getByText('name editable: false')).toBeInTheDocument();
    expect(screen.getByText('action column: false')).toBeInTheDocument();
  });

  test('reports an inline name edit as a rename of the old value to the new one', async () => {
    const user = userEvent.setup();
    const onRenameCell = vi.fn();
    renderProperties(table(), { onRenameCell });

    await user.click(screen.getByRole('button', { name: 'commit name edit' }));

    expect(onRenameCell).toHaveBeenCalledOnce();
    expect(onRenameCell).toHaveBeenCalledWith('total', 'total_usd');
  });

  test('reports no rename when a cell other than the name is edited', async () => {
    const user = userEvent.setup();
    const onRenameCell = vi.fn();
    renderProperties(table(), { onRenameCell });

    await user.click(screen.getByRole('button', { name: 'commit tag edit' }));

    expect(onRenameCell).not.toHaveBeenCalled();
  });
});

describe('TableProperties schema metadata', () => {
  test('an active source table shows its ordering key, partition column, and granularity', () => {
    renderProperties(
      table({
        ordering_key: ['event_id', 'request_time'],
        partition_by: { column: 'request_time', granularity: PartitionGranularity.Day },
      }),
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
    expect(screen.getByText('event_id, request_time')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.PartitionColumn)).toBeInTheDocument();
    expect(screen.getByText('request_time')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.Granularity)).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  test('an active source table with no partition hides partition column and granularity', () => {
    renderProperties(table({ ordering_key: ['event_id'] }));

    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.PartitionColumn)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.Granularity)).not.toBeInTheDocument();
  });

  test('an active source table shows its declared scan-metadata pair', () => {
    renderProperties(
      table({
        // Distinct from both pair values so each assertion below matches exactly one node.
        ordering_key: ['total'],
        identity_column: 'event_id',
        version_column: 'request_time',
      }),
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.IdentityColumn)).toBeInTheDocument();
    expect(screen.getByText('event_id')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.VersionColumn)).toBeInTheDocument();
    expect(screen.getByText('request_time')).toBeInTheDocument();
  });

  test('a source declaring no scan metadata shows neither label and no substitute message', () => {
    renderProperties(table({ ordering_key: ['event_id'] }));

    expect(screen.queryByText(AnalyticsTablesI18nKey.IdentityColumn)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.VersionColumn)).not.toBeInTheDocument();
  });

  test('a source declaring only one member shows that one and omits the other', () => {
    renderProperties(table({ ordering_key: ['event_id'], version_column: 'request_time' }));

    expect(screen.getByText(AnalyticsTablesI18nKey.VersionColumn)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.IdentityColumn)).not.toBeInTheDocument();
  });

  test('a system scan-metadata column absent from the columns grid still renders in the summary', () => {
    renderProperties(
      table({
        ordering_key: ['event_id'],
        identity_column: 'event_id',
        // A `_`-prefixed system column: legitimately not among `columns`.
        version_column: '_ingested_at',
        columns: [{ source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid }],
      }),
    );

    expect(screen.getByText('_ingested_at')).toBeInTheDocument();
    expect(screen.getByText('columns: 1')).toBeInTheDocument();
  });

  test('an active enrichment table shows its grain key', () => {
    renderProperties(
      table({
        name: 'order_flags',
        type: AnalyticsTableType.Enrichment,
        source_table: 'orders',
        grain: { grain_key: 'order_id' },
      }),
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.GrainKey)).toBeInTheDocument();
    expect(screen.getByText('order_id')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
  });

  // The summary is where a key is read rather than chosen, so it carries the same explanations the draft
  // surface does — minus the group note, whose point is that the values can still be set.
  test('an active source table explains every summarized key', () => {
    renderProperties(
      table({
        ordering_key: ['event_id'],
        partition_by: { column: 'request_time', granularity: PartitionGranularity.Day },
        identity_column: 'event_id',
        version_column: 'request_time',
      }),
    );

    [
      AnalyticsTablesI18nKey.OrderingKeyHint,
      AnalyticsTablesI18nKey.PartitionColumnHint,
      AnalyticsTablesI18nKey.GranularityHint,
      AnalyticsTablesI18nKey.IdentityColumnHint,
      AnalyticsTablesI18nKey.VersionColumnHint,
    ].forEach((hint) => expect(screen.getByRole('button', { name: hint })).toBeInTheDocument());
    expect(screen.queryByText(AnalyticsTablesI18nKey.KeysNote)).toBeNull();
  });

  test('an active enrichment table explains its grain key', () => {
    renderProperties(
      table({
        name: 'order_flags',
        type: AnalyticsTableType.Enrichment,
        source_table: 'orders',
        grain: { grain_key: 'order_id' },
      }),
    );

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.GrainKeyHint })).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.KeysNote)).toBeNull();
  });

  test('an active enrichment table names the source table it enriches', () => {
    renderProperties(
      table({
        name: 'order_flags',
        type: AnalyticsTableType.Enrichment,
        source_table: 'orders',
        grain: { grain_key: 'order_id' },
      }),
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.SourceTable)).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
  });

  test('a draft enrichment table names its source table and shows no grain key', () => {
    renderProperties(
      table({
        name: 'order_flags',
        type: AnalyticsTableType.Enrichment,
        status: TableStatus.Pending,
        source_table: 'orders',
      }),
    );

    expect(screen.getByText(AnalyticsTablesI18nKey.SourceTable)).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.GrainKey)).not.toBeInTheDocument();
  });

  test('a source table shows no source-table value, since it enriches nothing', () => {
    renderProperties(table({ ordering_key: ['event_id'] }));

    expect(screen.queryByText(AnalyticsTablesI18nKey.SourceTable)).not.toBeInTheDocument();
  });

  test('a PENDING table does not show the read-only metadata row (the draft editor covers it)', () => {
    renderProperties(table({ status: TableStatus.Pending, ordering_key: ['event_id'] }));

    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
  });
});

describe('TableProperties lifecycle status', () => {
  test('an ACTIVE table shows the columns grid rather than the draft editor', () => {
    renderProperties(table({ status: TableStatus.Active }));

    expect(screen.getByText(/^columns:/)).toBeInTheDocument();
    expect(screen.queryByText('draft-schema-editor')).not.toBeInTheDocument();
  });

  test('a PENDING table shows the draft schema editor rather than the columns grid', () => {
    renderProperties(table({ status: TableStatus.Pending }));

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
    expect(screen.queryByText(/^columns:/)).not.toBeInTheDocument();
  });

  test('a FAILED table also shows the draft schema editor', () => {
    renderProperties(table({ status: TableStatus.Failed }));

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AccessTab from '@/src/components/Analytics/Tables/access/AccessTab';
import { AccessStatus, PrivilegeMark, RoleRow, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import { TableAccessState } from '@/src/components/Analytics/Tables/access/use-table-access';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryExprType, QueryOperator, QueryValueType } from '@/src/models/analytics/query';

interface MockColDef {
  field?: string;
  colId?: string;
  headerName?: string;
  cellRenderer?: (params: { data: RoleRow }) => React.ReactNode;
  cellRendererParams?: { items?: { id: string; onClick: (row: RoleRow) => void; hidden?: () => boolean }[] };
}

// The grid is a stand-in: it renders each cell through its column's renderer and exposes the row-open
// handlers and the row actions the real grid would wire to the pointer and keyboard.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    columnDefs,
    additionalGridOptions,
    emptyDataProps,
  }: {
    rowData?: RoleRow[];
    columnDefs?: MockColDef[];
    additionalGridOptions?: {
      onCellClicked: (e: unknown) => void;
      onCellKeyDown: (e: unknown) => void;
    };
    emptyDataProps?: { title: string };
  }) => {
    const actions = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    const click = (field: string, data: RoleRow) => additionalGridOptions?.onCellClicked({ colDef: { field }, data });
    const press = (key: string, data: RoleRow) =>
      additionalGridOptions?.onCellKeyDown({ event: { key }, colDef: { field: 'role' }, data });

    return (
      <div>
        <div>
          {`headers: ${columnDefs
            ?.map((c) => c.headerName)
            .filter(Boolean)
            .join('|')}`}
        </div>
        {!rowData?.length && <div>{emptyDataProps?.title}</div>}
        {rowData?.map((row) => (
          <div key={row.role} aria-label={`row-${row.role}`} role="group">
            {columnDefs
              ?.filter((c) => c.cellRenderer && c.field !== ACTIONS_COLUMN_CEL_ID)
              .map((c) => (
                <div key={c.colId ?? c.field}>{c.cellRenderer?.({ data: row })}</div>
              ))}
            <button onClick={() => click('role', row)}>{`open-${row.role}`}</button>
            <button onClick={() => click(ACTIONS_COLUMN_CEL_ID, row)}>{`click-actions-${row.role}`}</button>
            <button onClick={() => press('Enter', row)}>{`enter-${row.role}`}</button>
            <button onClick={() => press('a', row)}>{`other-key-${row.role}`}</button>
            {actions
              .filter((item) => !item.hidden?.())
              .map((item) => (
                <button key={item.id} onClick={() => item.onClick(row)}>
                  {`${item.id}:${row.role}`}
                </button>
              ))}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('@/src/components/Analytics/Tables/access/RoleDrawer', () => ({
  default: ({ role, isSystem }: { role: string | null; isSystem: boolean }) => (
    <div>{`drawer: ${role === null ? 'new' : role} system: ${isSystem}`}</div>
  ),
}));
vi.mock('@/src/components/Analytics/Tables/access/RemoveRoleDialog', () => ({
  default: ({ row }: { row: RoleRow }) => <div>{`remove-dialog: ${row.role}`}</div>,
}));

const filter = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field as const, name: 'project_id' },
    { type: QueryExprType.Value as const, value_type: QueryValueType.String, value: 'X-PRJ-1' },
  ],
};

const none = {
  get: PrivilegeMark.None,
  read: PrivilegeMark.None,
  write: PrivilegeMark.None,
  modify: PrivilegeMark.None,
};

const ROWS: RoleRow[] = [
  {
    role: 'team-x',
    marks: { ...none, get: PrivilegeMark.Implied, read: PrivilegeMark.Stored },
    isSensitive: false,
    rowsKind: RowsCellKind.Policy,
    filter,
  },
  {
    role: 'pii-analysts',
    marks: { ...none, get: PrivilegeMark.Implied, read: PrivilegeMark.Stored },
    isSensitive: true,
    rowsKind: RowsCellKind.All,
  },
  {
    role: 'ingest-bot',
    marks: { ...none, write: PrivilegeMark.Stored },
    isSensitive: false,
    rowsKind: RowsCellKind.None,
  },
];

const COLUMNS = [{ source_name: 'p', name: 'project_id', type: AnalyticsFieldType.String }];

const makeState = (over: Partial<TableAccessState> = {}): TableAccessState =>
  ({
    status: AccessStatus.Ready,
    rows: ROWS,
    access: {},
    policies: {},
    isTabOffered: true,
    removeRole: vi.fn(),
    ...over,
  }) as unknown as TableAccessState;

const renderTab = (access = makeState(), isSystem = false) =>
  render(<AccessTab tableName="project_costs_daily" columns={COLUMNS} isSystem={isSystem} access={access} />);

const rowOf = (role: string) => within(screen.getByRole('group', { name: `row-${role}` }));

beforeEach(() => vi.clearAllMocks());

describe('AccessTab — roles table', () => {
  test('lists a row for each role with the column headers and the caption', () => {
    renderTab();

    expect(screen.getByText(/headers: .*ColRole.*ColGet.*ColRead.*ColWrite.*ColModify.*ColRows/)).toBeInTheDocument();
    ROWS.forEach(({ role }) => expect(screen.getByRole('group', { name: `row-${role}` })).toBeInTheDocument());
  });

  test('names each mark as stored, implied or not granted', () => {
    renderTab();

    expect(rowOf('team-x').getByRole('img', { name: AnalyticsTableAccessI18nKey.MarkImplied })).toBeInTheDocument();
    expect(rowOf('team-x').getByRole('img', { name: AnalyticsTableAccessI18nKey.MarkStored })).toBeInTheDocument();
    expect(rowOf('ingest-bot').getAllByRole('img', { name: AnalyticsTableAccessI18nKey.MarkNone }).length).toBe(3);
  });

  test('flags a role that holds the sensitive clearance', () => {
    renderTab();

    expect(rowOf('pii-analysts').getByRole('img', { name: AnalyticsTablesI18nKey.Sensitive })).toBeInTheDocument();
    expect(rowOf('team-x').queryByRole('img', { name: AnalyticsTablesI18nKey.Sensitive })).toBeNull();
  });

  test('states what each role reads: the limit, all rows, or none', () => {
    renderTab();

    expect(rowOf('team-x').getByText('project_id = X-PRJ-1')).toBeInTheDocument();
    expect(rowOf('pii-analysts').getByText(AnalyticsTableAccessI18nKey.AllRows)).toBeInTheDocument();
    expect(rowOf('ingest-bot').getByText(AnalyticsTableAccessI18nKey.CannotReadRows)).toBeInTheDocument();
  });

  test('shows the empty state for a table with no roles, without search or filters', () => {
    renderTab(makeState({ rows: [] }));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.EmptyTitle)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.EmptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: AnalyticsTableAccessI18nKey.FilterCanRead })).toBeNull();
    expect(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.AddRole })).toBeEnabled();
  });

  test('says nothing matches when the search or filters hide every role', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(screen.getByRole('textbox'), 'no-such-role');

    expect(screen.getByText(AnalyticsTableAccessI18nKey.NoMatches)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EmptyTitle)).toBeNull();
  });
});

describe('AccessTab — search and filters', () => {
  test('narrows the rows by role name, ignoring case', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(screen.getByRole('textbox'), 'PII');

    expect(screen.getByRole('group', { name: 'row-pii-analysts' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'row-team-x' })).toBeNull();
  });

  test('keeps only the roles that can read when Can read is selected', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.FilterCanRead }));

    expect(screen.queryByRole('group', { name: 'row-ingest-bot' })).toBeNull();
    expect(screen.getByRole('group', { name: 'row-team-x' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.FilterCanRead })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('keeps only the roles with a row limit when Rows limited is selected', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.FilterRowsLimited }));

    expect(screen.getByRole('group', { name: 'row-team-x' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'row-pii-analysts' })).toBeNull();
  });

  test('shows every row again when a filter is switched off', async () => {
    const user = userEvent.setup();
    renderTab();
    const chip = screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.FilterCanRead });

    await user.click(chip);
    await user.click(chip);

    expect(screen.getByRole('group', { name: 'row-ingest-bot' })).toBeInTheDocument();
  });
});

describe('AccessTab — opening and removing', () => {
  test('opens the drawer on a new role from Add role', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.AddRole }));

    expect(screen.getByText(/drawer: new/)).toBeInTheDocument();
  });

  test('opens the drawer on the role of a clicked row and passes the system flag', async () => {
    const user = userEvent.setup();
    renderTab(makeState(), true);

    await user.click(screen.getByRole('button', { name: 'open-team-x' }));

    expect(screen.getByText('drawer: team-x system: true')).toBeInTheDocument();
  });

  test('opens the drawer from the keyboard with Enter only', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: 'other-key-team-x' }));
    expect(screen.queryByText(/drawer:/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'enter-team-x' }));

    expect(screen.getByText(/drawer: team-x/)).toBeInTheDocument();
  });

  test('does not open the drawer from a click on the actions column', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: 'click-actions-team-x' }));

    expect(screen.queryByText(/drawer:/)).toBeNull();
  });

  test('opens the removal dialog for the row whose action is chosen', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: /Remove:ingest-bot/ }));

    expect(screen.getByText('remove-dialog: ingest-bot')).toBeInTheDocument();
  });
});

describe('AccessTab — before the data has loaded', () => {
  test('disables Add role, the row actions and the row click when the read failed', async () => {
    const user = userEvent.setup();
    renderTab(makeState({ status: AccessStatus.Failed, rows: ROWS }));

    expect(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.AddRole })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Remove:team-x/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'open-team-x' }));
    expect(screen.queryByText(/drawer:/)).toBeNull();
  });
});

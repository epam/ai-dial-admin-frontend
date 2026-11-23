import { notificationMock } from '@/test-mocks/notification';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AccessChangeOutcome, AccessStatus } from '@/src/components/Analytics/Tables/access/models';
import RoleDrawer from '@/src/components/Analytics/Tables/access/RoleDrawer';
import { SaveEntryResult, TableAccessState } from '@/src/components/Analytics/Tables/access/use-table-access';
import { buildRoleRows } from '@/src/components/Analytics/Tables/access/utils';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import {
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
  IneffectiveGrant,
  IneffectiveGrantReason,
  TableAccessConfig,
  TableAccessEntry,
  TableGrantKey,
} from '@/src/models/analytics/table';
import { ConfigEntityOrigin } from '@/src/types/config-file-entity';

const { showNotification } = notificationMock;

vi.mock('@/src/components/Analytics/Tables/access/use-role-catalog', () => ({
  useRoleCatalog: () => ({
    roles: [
      { name: 'analysts', origin: ConfigEntityOrigin.ConfigFile },
      { name: 'team-x', origin: ConfigEntityOrigin.ConfigFile },
      { name: 'team-z', origin: ConfigEntityOrigin.Api },
    ],
    isLoading: false,
  }),
}));

const FILTER: QueryFilterNode = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: 'project_id' },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'Z-PRJ-3' },
  ],
};

// The condition editor is covered in RowLimitEditor.spec; here it is two controls that report a value the
// way the real one does, and a probe for what the drawer handed it.
vi.mock('@/src/components/Analytics/Tables/access/RowLimitEditor', () => ({
  default: ({
    onChange,
    initialFilter,
    highlightedField,
  }: {
    onChange: (value: { filter: unknown; isComplete: boolean }) => void;
    initialFilter: unknown;
    highlightedField?: string | null;
  }) => (
    <div>
      <span>{`initial: ${JSON.stringify(initialFilter)}`}</span>
      <span>{`highlighted: ${highlightedField ?? 'none'}`}</span>
      <button onClick={() => onChange({ filter: FILTER, isComplete: true })}>set-limit</button>
      <button onClick={() => onChange({ filter: null, isComplete: true })}>clear-limit</button>
      <button onClick={() => onChange({ filter: FILTER, isComplete: false })}>set-incomplete-limit</button>
    </div>
  ),
}));

const COLUMNS: AnalyticsTableColumn[] = [
  { source_name: 'p', name: 'project_id', type: AnalyticsFieldType.String },
  { source_name: 'e', name: 'user_email', type: AnalyticsFieldType.String, sensitive: true },
];

const ENRICHMENTS: AnalyticsTable[] = [
  {
    name: 'project_owners',
    type: AnalyticsTableType.Enrichment,
    columns: [{ source_name: 'o', name: 'owner', type: AnalyticsFieldType.String }],
  },
];

const entry = (privileges: TableGrantKey[], over: Partial<TableAccessEntry> = {}): TableAccessEntry => ({
  privileges,
  rows: null,
  columns: null,
  ...over,
});

const READ = entry([TableGrantKey.Read]);
const WRITE = entry([TableGrantKey.Write]);

const config = (roles: Record<string, TableAccessEntry>): TableAccessConfig => ({
  generation: 2,
  roles,
  ineffective_grants: [],
});

const answer = (role: string, ineffective: IneffectiveGrant[]): SaveEntryResult => ({
  outcome: AccessChangeOutcome.Done,
  result: { ...READ, generation: 3, role, ineffective_grants: ineffective },
});

const makeAccess = (roles: Record<string, TableAccessEntry> = { 'team-x': READ }) => {
  const state = {
    status: AccessStatus.Ready,
    rows: buildRoleRows(roles, []),
    roles,
    warnings: [],
    isTabOffered: true,
    reload: vi.fn<TableAccessState['reload']>().mockResolvedValue(config(roles)),
    saveEntry: vi.fn<TableAccessState['saveEntry']>().mockResolvedValue({ outcome: AccessChangeOutcome.Done }),
    removeRole: vi.fn<TableAccessState['removeRole']>(),
  };

  return state satisfies TableAccessState;
};

const baseProps = {
  tableName: 'project_costs_daily',
  columns: COLUMNS,
  isSystem: false,
  isEnrichment: false,
  enrichments: [],
  hasEnrichmentsFailed: false,
};

const renderDrawer = (access = makeAccess(), props: Partial<React.ComponentProps<typeof RoleDrawer>> = {}) => {
  const onClose = vi.fn();
  render(<RoleDrawer {...baseProps} access={access} role="team-x" onClose={onClose} {...props} />);

  return { access, onClose };
};

const card = (key: AnalyticsTableAccessI18nKey) => screen.getByRole('checkbox', { name: new RegExp(key) });
const saveButton = () => screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRole });
const radio = (key: AnalyticsTableAccessI18nKey) => screen.getByRole('radio', { name: key });
const columnsPicker = () =>
  screen.getByRole('combobox', { name: new RegExp(`^${AnalyticsTableAccessI18nKey.StepColumns}`) });

beforeEach(() => vi.clearAllMocks());

describe('RoleDrawer — steps', () => {
  test('edits an existing role: its name is read-only and its stored grants are selected', () => {
    renderDrawer();

    expect(screen.getByRole('dialog', { name: AnalyticsTableAccessI18nKey.DrawerLabel })).toBeInTheDocument();
    expect(screen.getByText('team-x')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeChecked();
    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).not.toBeChecked();
  });

  test('shows Get as held and fixed, with where it comes from, while Read is selected', () => {
    renderDrawer();

    expect(card(AnalyticsTableAccessI18nKey.ColGet)).toBeChecked();
    expect(card(AnalyticsTableAccessI18nKey.ColGet)).toBeDisabled();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.ViaPrivilege)).toBeInTheDocument();
  });

  test('offers none of the sensitive, rows and columns steps while only Write is selected', () => {
    renderDrawer(makeAccess({ 'team-x': WRITE }));

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepSensitive)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepRows)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepColumns)).toBeNull();
  });

  test('offers the sensitive and columns steps, without the rows step, once Modify is selected', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ 'team-x': WRITE }));

    await user.click(card(AnalyticsTableAccessI18nKey.ColModify));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepSensitive)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepColumns)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepRows)).toBeNull();
  });

  test('says in the sensitive step that the clearance belongs to the role', () => {
    renderDrawer();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.SensitiveScope)).toBeInTheDocument();
  });

  test('says in the rows step that the limit also applies to SQL, CSV export and Flight SQL', () => {
    renderDrawer();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowsScope)).toBeInTheDocument();
  });

  test('shows no scope note when its step is not offered', () => {
    renderDrawer(makeAccess({ 'team-x': WRITE }));

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.SensitiveScope)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RowsScope)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.ColumnsScope)).toBeNull();
  });

  test('names the sensitive columns of the table in the sensitive step', () => {
    renderDrawer();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.SensitiveIncludes)).toBeInTheDocument();
  });

  test('offers the rows step with All rows chosen for a role that has no row limit', () => {
    renderDrawer();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepRows)).toBeInTheDocument();
    expect(radio(AnalyticsTableAccessI18nKey.RowsAll)).toBeChecked();
    expect(screen.queryByText('set-limit')).toBeNull();
  });

  test('shows the row-limit editor, seeded with the stored limit, for a role that has one', () => {
    renderDrawer(makeAccess({ 'team-x': entry([TableGrantKey.Read], { rows: { filter: FILTER } }) }));

    expect(radio(AnalyticsTableAccessI18nKey.RowsSome)).toBeChecked();
    expect(screen.getByText(`initial: ${JSON.stringify(FILTER)}`)).toBeInTheDocument();
  });

  test('locks Write and Modify on a system table with the reason, leaving Read and the rows step', () => {
    renderDrawer(makeAccess(), { isSystem: true });

    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).toBeDisabled();
    expect(card(AnalyticsTableAccessI18nKey.ColModify)).toBeDisabled();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeEnabled();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.SystemLockReason)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepRows)).toBeInTheDocument();
  });

  test('closes with Cancel without sending anything', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(access.saveEntry).not.toHaveBeenCalled();
  });
});

describe('RoleDrawer — the columns step', () => {
  test.each([
    ['Get', TableGrantKey.Get],
    ['Read', TableGrantKey.Read],
    ['Modify', TableGrantKey.Modify],
  ])('is offered with All columns chosen for a role that holds %s and has no column limit', (_name, key) => {
    renderDrawer(makeAccess({ 'team-x': entry([key]) }));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepColumns)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.ColumnsScope)).toBeInTheDocument();
    expect(radio(AnalyticsTableAccessI18nKey.ColumnsAll)).toBeChecked();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  test('opens on Only some columns for a role that has a column limit', () => {
    renderDrawer(makeAccess({ 'team-x': entry([TableGrantKey.Read], { columns: ['project_id'] }) }));

    expect(radio(AnalyticsTableAccessI18nKey.ColumnsSome)).toBeChecked();
    expect(columnsPicker()).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.DerivedTablesNote)).toBeInTheDocument();
  });

  test('states the derived-tables note once when both a row limit and a column limit are set', () => {
    renderDrawer(
      makeAccess({
        'team-x': entry([TableGrantKey.Read], { rows: { filter: FILTER }, columns: ['project_id'] }),
      }),
    );

    expect(screen.getAllByText(AnalyticsTableAccessI18nKey.DerivedTablesNote)).toHaveLength(1);
  });

  test('disables Save role while Only some columns is chosen and nothing is picked', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(radio(AnalyticsTableAccessI18nKey.ColumnsSome));

    expect(saveButton()).toBeDisabled();
  });

  test('offers the columns of the table and of its enrichments, and sends the picked names', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(makeAccess(), { enrichments: ENRICHMENTS });

    await user.click(radio(AnalyticsTableAccessI18nKey.ColumnsSome));
    await user.click(columnsPicker());
    expect(screen.getByRole('option', { name: /^user_email/ })).toHaveTextContent(
      AnalyticsTableAccessI18nKey.ColumnSensitive,
    );
    const enrichmentColumn = screen.getByRole('option', { name: /^project_owners\.owner/ });
    expect(enrichmentColumn).toHaveTextContent(/^project_owners\.owner$/);
    await user.click(screen.getByRole('option', { name: /^project_id/ }));
    await user.click(enrichmentColumn);
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('team-x', {
      privileges: [TableGrantKey.Read],
      rows: null,
      columns: ['project_id', 'project_owners.owner'],
    });
  });

  test('keeps a stored column name the table no longer has', async () => {
    const user = userEvent.setup();
    const stored = entry([TableGrantKey.Read], { columns: ['project_id', 'dropped_column'] });
    const { access } = renderDrawer(makeAccess({ 'team-x': stored }));

    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('team-x', stored);
  });

  test('says beside the picker that the enrichment columns could not be read', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess(), { hasEnrichmentsFailed: true });

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.ColumnsEnrichmentsFailed)).toBeNull();
    await user.click(radio(AnalyticsTableAccessI18nKey.ColumnsSome));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.ColumnsEnrichmentsFailed)).toBeInTheDocument();
    expect(columnsPicker()).toBeEnabled();
  });
});

describe('RoleDrawer — adding a role', () => {
  test('keeps Save disabled until a role is chosen', () => {
    renderDrawer(makeAccess(), { role: null });

    expect(screen.getByRole('dialog', { name: AnalyticsTableAccessI18nKey.DrawerAddTitle })).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  test('states which population each offered role came from', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess(), { role: null });

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));

    expect(screen.getByRole('option', { name: /^analysts/ })).toHaveTextContent('Configuration file');
    expect(screen.getByRole('option', { name: /^team-z/ })).toHaveTextContent('API');
  });

  test('shows no privilege step until a role is chosen', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess(), { role: null });

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepAccess)).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));
    await user.click(screen.getByRole('option', { name: /^team-z/ }));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepAccess)).toBeInTheDocument();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeInTheDocument();
  });

  test('saves a newly chosen role, offered only because it has no entry, with one request', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer(makeAccess(), { role: null });

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));
    expect(screen.queryByRole('option', { name: /^team-x/ })).toBeNull();
    await user.click(screen.getByRole('option', { name: /^team-z/ }));
    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('team-z', READ);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  test('keeps showing the chosen role once it has an entry on the table', async () => {
    const user = userEvent.setup();
    const access = makeAccess();
    const props = { ...baseProps, role: null, onClose: vi.fn() };
    const { rerender } = render(<RoleDrawer {...props} access={access} />);

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));
    await user.click(screen.getByRole('option', { name: /^team-z/ }));
    rerender(<RoleDrawer {...props} access={makeAccess({ 'team-x': READ, 'team-z': READ })} />);

    // With an option description the kit renders the chosen label beside the input and names the field with it.
    expect(
      screen.getByRole('combobox', { name: `${AnalyticsTableAccessI18nKey.StepRole}, team-z` }),
    ).toBeInTheDocument();
  });
});

describe('RoleDrawer — saving', () => {
  test('sends the privileges, the row limit and the column limit in one request, then notifies and closes', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer();

    await user.click(card(AnalyticsTableAccessI18nKey.ColWrite));
    await user.click(radio(AnalyticsTableAccessI18nKey.RowsSome));
    await user.click(screen.getByRole('button', { name: 'set-limit' }));
    await user.click(radio(AnalyticsTableAccessI18nKey.ColumnsSome));
    await user.click(columnsPicker());
    await user.click(screen.getByRole('option', { name: /^project_id/ }));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('team-x', {
      privileges: [TableGrantKey.Read, TableGrantKey.Write],
      rows: { filter: FILTER },
      columns: ['project_id'],
    });
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessSaved }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('does not save while Only some rows is chosen and the predicate is empty', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(radio(AnalyticsTableAccessI18nKey.RowsSome));
    await user.click(screen.getByRole('button', { name: 'clear-limit' }));

    expect(saveButton()).toBeDisabled();
  });

  test('does not save while a condition of the predicate is unfinished', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(radio(AnalyticsTableAccessI18nKey.RowsSome));
    await user.click(screen.getByRole('button', { name: 'set-incomplete-limit' }));

    expect(saveButton()).toBeDisabled();
  });

  test('sends no row limit when All rows is chosen for a role that had one', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(
      makeAccess({ 'team-x': entry([TableGrantKey.Read], { rows: { filter: FILTER } }) }),
    );

    await user.click(radio(AnalyticsTableAccessI18nKey.RowsAll));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('team-x', READ);
  });

  test('keeps the stored row and column limits when Read is turned off and their steps are hidden', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(
      makeAccess({
        'team-x': entry([TableGrantKey.Read, TableGrantKey.Write], {
          rows: { filter: FILTER },
          columns: ['project_id'],
        }),
      }),
    );

    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('team-x', {
      privileges: [TableGrantKey.Write],
      rows: { filter: FILTER },
      columns: ['project_id'],
    });
  });

  test('stays in editing with Save role offered when the service refuses the entry', async () => {
    const user = userEvent.setup();
    const access = makeAccess();
    access.saveEntry.mockResolvedValue({
      outcome: AccessChangeOutcome.Failed,
      errorMessage: 'project_id is not a column',
    });
    const { onClose } = renderDrawer(access);

    await user.click(radio(AnalyticsTableAccessI18nKey.RowsSome));
    await user.click(screen.getByRole('button', { name: 'set-limit' }));
    await user.click(saveButton());

    expect(await screen.findByText('highlighted: project_id')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(saveButton()).toBeEnabled();
    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).toBeEnabled();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.ConflictMessage)).toBeNull();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('sends the same request again when the save is repeated after a busy answer', async () => {
    const user = userEvent.setup();
    const access = makeAccess();
    access.saveEntry.mockResolvedValueOnce({ outcome: AccessChangeOutcome.Failed, errorMessage: 'table is busy' });
    const { onClose } = renderDrawer(access);

    await user.click(saveButton());
    await waitFor(() => expect(saveButton()).toBeEnabled());
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledTimes(2);
    expect(access.saveEntry).toHaveBeenNthCalledWith(1, 'team-x', READ);
    expect(access.saveEntry).toHaveBeenNthCalledWith(2, 'team-x', READ);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});

describe('RoleDrawer — a role changed by someone else', () => {
  const conflict = (roles: Record<string, TableAccessEntry> = { 'team-x': READ }) => {
    const access = makeAccess(roles);
    access.saveEntry.mockResolvedValue({ outcome: AccessChangeOutcome.Conflict });

    return access;
  };
  const reloadButton = () => screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.ReloadRole });

  test('stays open with the conflict banner, disables Save role and offers Reload role', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer(conflict());

    await user.click(card(AnalyticsTableAccessI18nKey.ColWrite));
    await user.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(AnalyticsTableAccessI18nKey.ConflictMessage);
    expect(saveButton()).toBeDisabled();
    expect(reloadButton()).toBeEnabled();
    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).toBeChecked();
    expect(onClose).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
    expect(access.saveEntry).toHaveBeenCalledOnce();
  });

  test('resets every step to the entry read again and makes Save role work', async () => {
    const user = userEvent.setup();
    const access = conflict();
    const fresh = entry([TableGrantKey.Read, TableGrantKey.Modify], {
      rows: { filter: FILTER },
      columns: ['project_id'],
    });
    access.reload.mockResolvedValue(config({ 'team-x': fresh }));
    renderDrawer(access);
    await user.click(card(AnalyticsTableAccessI18nKey.ColWrite));
    await user.click(saveButton());

    await user.click(await screen.findByRole('button', { name: AnalyticsTableAccessI18nKey.ReloadRole }));

    expect(await screen.findByText(`initial: ${JSON.stringify(FILTER)}`)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.ConflictMessage)).toBeNull();
    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).not.toBeChecked();
    expect(card(AnalyticsTableAccessI18nKey.ColModify)).toBeChecked();
    expect(radio(AnalyticsTableAccessI18nKey.RowsSome)).toBeChecked();
    expect(radio(AnalyticsTableAccessI18nKey.ColumnsSome)).toBeChecked();
    expect(saveButton()).toBeEnabled();

    access.saveEntry.mockResolvedValue({ outcome: AccessChangeOutcome.Done });
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenLastCalledWith('team-x', fresh);
  });

  test('resets to nothing granted when the role no longer has an entry', async () => {
    const user = userEvent.setup();
    const access = conflict();
    access.reload.mockResolvedValue(config({}));
    renderDrawer(access);
    await user.click(saveButton());

    await user.click(await screen.findByRole('button', { name: AnalyticsTableAccessI18nKey.ReloadRole }));

    await waitFor(() => expect(card(AnalyticsTableAccessI18nKey.ColRead)).not.toBeChecked());
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.ConflictMessage)).toBeNull();
    expect(card(AnalyticsTableAccessI18nKey.ColGet)).not.toBeChecked();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepRows)).toBeNull();
  });

  test('keeps the banner and the unsaved input when the reload fails', async () => {
    const user = userEvent.setup();
    const access = conflict();
    access.reload.mockResolvedValue(null);
    renderDrawer(access);
    await user.click(card(AnalyticsTableAccessI18nKey.ColWrite));
    await user.click(saveButton());

    await user.click(await screen.findByRole('button', { name: AnalyticsTableAccessI18nKey.ReloadRole }));

    await waitFor(() => expect(reloadButton()).toBeEnabled());
    expect(screen.getByRole('alert')).toHaveTextContent(AnalyticsTableAccessI18nKey.ConflictMessage);
    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).toBeChecked();
    expect(saveButton()).toBeDisabled();
  });
});

describe('RoleDrawer — grants that change nothing', () => {
  const alreadyGlobal: IneffectiveGrant = {
    role: 'team-x',
    key: TableGrantKey.Read,
    reason: IneffectiveGrantReason.AlreadyGlobal,
    message: 'already global',
  };

  const ineffective = (grants: IneffectiveGrant[] = [alreadyGlobal]) => {
    const access = makeAccess();
    access.saveEntry.mockResolvedValue(answer('team-x', grants));

    return access;
  };

  test('stays open with the Read banner in the shared stack, and offers Done instead of Save', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer(ineffective());

    await user.click(saveButton());

    expect(await screen.findByRole('status')).toHaveTextContent('already global');
    expect(screen.queryByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRole })).toBeNull();
    expect(showNotification).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('shows no banner for another role named in the same answer', async () => {
    const user = userEvent.setup();
    renderDrawer(
      ineffective([
        {
          role: 'admin',
          key: TableGrantKey.Get,
          reason: IneffectiveGrantReason.AlreadyGlobal,
          message: 'admin already global',
        },
        alreadyGlobal,
      ]),
    );

    await user.click(saveButton());

    expect(await screen.findByText('already global')).toBeTruthy();
    expect(screen.queryByText('admin already global')).toBeNull();
  });

  test('locks the steps once saved and closes without a request on Done', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer(ineffective());
    await user.click(saveButton());

    await user.click(await screen.findByRole('button', { name: AnalyticsTableAccessI18nKey.Done }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(access.saveEntry).toHaveBeenCalledOnce();
  });

  test('disables the privilege cards once saved with a banner', async () => {
    const user = userEvent.setup();
    renderDrawer(ineffective());

    await user.click(saveButton());

    expect(await screen.findByRole('button', { name: AnalyticsTableAccessI18nKey.Done })).toBeInTheDocument();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeDisabled();
  });

  test('puts a banner for the clearance inside the sensitive step', async () => {
    const user = userEvent.setup();
    renderDrawer(
      ineffective([
        {
          role: 'team-x',
          key: TableGrantKey.Sensitive,
          reason: IneffectiveGrantReason.SensitiveWithoutVerb,
          message: 'no verb',
        },
      ]),
    );

    await user.click(saveButton());

    expect(await screen.findByText('no verb')).toBeInTheDocument();
  });
});

describe('RoleDrawer — the everyone grantee', () => {
  const everyone = /EveryoneLabel/;

  const pickEveryone = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('combobox', { name: new RegExp(AnalyticsTableAccessI18nKey.StepRole) }));
    await user.click(screen.getByRole('option', { name: everyone }));
  };

  test('offers Everyone first, with its description, ahead of the catalog roles', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess(), { role: null });

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));

    const [first] = screen.getAllByRole('option');
    expect(first).toHaveTextContent(AnalyticsTableAccessI18nKey.EveryoneLabel);
    expect(first).toHaveTextContent(AnalyticsTableAccessI18nKey.EveryoneDescription);
  });

  test('does not offer Everyone once the table has an entry for it', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ '*': READ }), { role: null });

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));

    expect(screen.queryByRole('option', { name: everyone })).toBeNull();
  });

  test('keeps showing Everyone in the picker once its new entry is stored', async () => {
    const user = userEvent.setup();
    const props = { ...baseProps, role: null, onClose: vi.fn() };
    const { rerender } = render(<RoleDrawer {...props} access={makeAccess({})} />);

    await pickEveryone(user);
    rerender(<RoleDrawer {...props} access={makeAccess({ '*': READ })} />);

    expect(
      screen.getByRole('combobox', {
        name: `${AnalyticsTableAccessI18nKey.StepRole}, ${AnalyticsTableAccessI18nKey.EveryoneLabel}`,
      }),
    ).toBeInTheDocument();
  });

  test('shows the label, not the literal grantee, when editing its entry', () => {
    renderDrawer(makeAccess({ '*': READ }), { role: '*' });

    expect(screen.getByText(AnalyticsTableAccessI18nKey.EveryoneLabel)).toBeInTheDocument();
    expect(screen.queryByText('*')).toBeNull();
  });

  test('locks Write and Modify with the reason and leaves Read selectable', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({}), { role: null });

    await pickEveryone(user);

    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).toBeDisabled();
    expect(card(AnalyticsTableAccessI18nKey.ColModify)).toBeDisabled();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeEnabled();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.EveryoneLockReason)).toBeInTheDocument();
  });

  test('drops a Write selection made for another role once Everyone is picked', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(makeAccess({}), { role: null });

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));
    await user.click(screen.getByRole('option', { name: /^team-z/ }));
    await user.click(card(AnalyticsTableAccessI18nKey.ColWrite));
    await pickEveryone(user);
    await user.click(card(AnalyticsTableAccessI18nKey.ColGet));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('*', entry([TableGrantKey.Get]));
  });

  test('warns before saving that everyone will read every row, and keeps Save enabled', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({}), { role: null });

    await pickEveryone(user);
    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));

    expect(screen.getByRole('status')).toHaveTextContent(AnalyticsTableAccessI18nKey.EveryoneAllRowsWarning);
    expect(saveButton()).toBeEnabled();

    await user.click(radio(AnalyticsTableAccessI18nKey.RowsSome));

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneAllRowsWarning)).toBeNull();
  });

  test('shows no such warning for a provider role that reads all rows', () => {
    renderDrawer();

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneAllRowsWarning)).toBeNull();
  });

  test('sends the row limit and Read together in one request, without a confirmation', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer(makeAccess({}), { role: null });

    await pickEveryone(user);
    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(radio(AnalyticsTableAccessI18nKey.RowsSome));
    await user.click(screen.getByRole('button', { name: 'set-limit' }));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('*', {
      privileges: [TableGrantKey.Read],
      rows: { filter: FILTER },
      columns: null,
    });
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneConfirmTitle)).toBeNull();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  test('shows the lifted-policies answer as a banner, not a notification', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ '*': READ });
    access.saveEntry.mockResolvedValue(
      answer('*', [
        { role: '*', key: TableGrantKey.Read, reason: IneffectiveGrantReason.LiftsRowPolicies, message: 'lifts' },
      ]),
    );
    renderDrawer(access, { role: '*' });

    await user.click(saveButton());

    expect(await screen.findByText('lifts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.Done })).toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
  });
});

describe('RoleDrawer — confirming Read on all rows for everyone', () => {
  const openConfirmation = async (user: ReturnType<typeof userEvent.setup>) => {
    const view = renderDrawer(makeAccess({ '*': entry([TableGrantKey.Get]) }), { role: '*' });
    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(saveButton());

    return view;
  };
  const confirmation = () => screen.getByRole('dialog', { name: AnalyticsTableAccessI18nKey.EveryoneConfirmTitle });

  test('opens the confirmation and sends nothing', async () => {
    const user = userEvent.setup();
    const { access } = await openConfirmation(user);

    expect(confirmation()).toHaveTextContent(AnalyticsTableAccessI18nKey.EveryoneConfirmDescription);
    expect(access.saveEntry).not.toHaveBeenCalled();
  });

  test('sends the entry on Grant to everyone', async () => {
    const user = userEvent.setup();
    const { access, onClose } = await openConfirmation(user);

    await user.click(
      within(confirmation()).getByRole('button', { name: AnalyticsTableAccessI18nKey.EveryoneConfirmGrant }),
    );

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('*', entry([TableGrantKey.Get, TableGrantKey.Read]));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  test('switches to Only some rows and sends nothing on Set a row limit', async () => {
    const user = userEvent.setup();
    const { access, onClose } = await openConfirmation(user);

    await user.click(
      within(confirmation()).getByRole('button', { name: AnalyticsTableAccessI18nKey.EveryoneConfirmSetLimit }),
    );

    expect(radio(AnalyticsTableAccessI18nKey.RowsSome)).toBeChecked();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneConfirmTitle)).toBeNull();
    expect(access.saveEntry).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('keeps All rows and sends nothing when the confirmation is closed', async () => {
    const user = userEvent.setup();
    const { access, onClose } = await openConfirmation(user);

    await waitFor(() => expect(confirmation()).toHaveFocus());
    await user.keyboard('{Escape}');

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneConfirmTitle)).toBeNull();
    expect(radio(AnalyticsTableAccessI18nKey.RowsAll)).toBeChecked();
    expect(access.saveEntry).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('asks nothing when the stored entry already holds Read with no row limit', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(makeAccess({ '*': READ }), { role: '*' });

    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith('*', READ);
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneConfirmTitle)).toBeNull();
  });

  test('asks nothing for a provider role that is given Read on all rows', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(makeAccess({ 'team-x': WRITE }));

    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledOnce();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.EveryoneConfirmTitle)).toBeNull();
  });
});

describe('RoleDrawer — an enrichment table', () => {
  const stored = entry([TableGrantKey.Get, TableGrantKey.Read, TableGrantKey.Sensitive, TableGrantKey.Write], {
    rows: { filter: FILTER },
    columns: ['project_id'],
  });

  test('locks Get and Read with the reason and leaves Write and Modify selectable', () => {
    renderDrawer(makeAccess({ 'team-x': stored }), { isEnrichment: true });

    expect(card(AnalyticsTableAccessI18nKey.ColGet)).toBeDisabled();
    expect(card(AnalyticsTableAccessI18nKey.ColGet)).not.toBeChecked();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeDisabled();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).not.toBeChecked();
    expect(card(AnalyticsTableAccessI18nKey.ColWrite)).toBeChecked();
    expect(card(AnalyticsTableAccessI18nKey.ColModify)).toBeEnabled();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.EnrichmentLockReason)).toBeInTheDocument();
  });

  test('offers none of the sensitive, rows and columns steps, even with Modify selected', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ 'team-x': stored }), { isEnrichment: true });

    await user.click(card(AnalyticsTableAccessI18nKey.ColModify));

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepSensitive)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepRows)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepColumns)).toBeNull();
  });

  test('sends an entry that holds only Write and Modify, with no row or column limit', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(makeAccess({ 'team-x': stored }), { isEnrichment: true });

    await user.click(card(AnalyticsTableAccessI18nKey.ColModify));
    await user.click(saveButton());

    expect(access.saveEntry).toHaveBeenCalledExactlyOnceWith(
      'team-x',
      entry([TableGrantKey.Write, TableGrantKey.Modify]),
    );
  });
});

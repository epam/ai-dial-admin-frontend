import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { PrivilegeMark, RoleRow, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import RoleDrawer from '@/src/components/Analytics/Tables/access/RoleDrawer';
import { TableAccessState } from '@/src/components/Analytics/Tables/access/use-table-access';
import { emptyAccess } from '@/src/components/Analytics/Tables/access/utils';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { AnalyticsTableColumn, IneffectiveGrantReason, TableAccess, TableGrantKey } from '@/src/models/analytics/table';
import { AccessStatus } from '@/src/components/Analytics/Tables/access/models';

const showNotification = vi.hoisted(() => vi.fn());
vi.mock('@/src/context/NotificationContext', () => ({ useNotification: () => ({ showNotification }) }));

vi.mock('@/src/components/Analytics/Tables/access/use-role-catalog', () => ({
  useRoleCatalog: () => ({ roles: ['analysts', 'team-x', 'team-z'], isLoading: false }),
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

const row = (role: string): RoleRow => ({
  role,
  marks: {
    get: PrivilegeMark.None,
    read: PrivilegeMark.None,
    write: PrivilegeMark.None,
    modify: PrivilegeMark.None,
  },
  isSensitive: false,
  rowsKind: RowsCellKind.None,
});

const makeAccess = (lists: Partial<TableAccess> = {}, policies: TableAccessState['policies'] = {}) => {
  const state = {
    status: AccessStatus.Ready,
    access: { ...emptyAccess(), ...lists },
    policies,
    rows: ['team-x'].map(row),
    isTabOffered: true,
    readFreshAccess: vi.fn(),
    saveGrants: vi.fn().mockResolvedValue({ isOk: true }),
    saveRowPolicy: vi.fn().mockResolvedValue({ isOk: true }),
    removeRole: vi.fn(),
  };

  return state as unknown as TableAccessState & typeof state;
};

const renderDrawer = (
  access = makeAccess({ read: ['team-x'] }),
  props: Partial<React.ComponentProps<typeof RoleDrawer>> = {},
) => {
  const onClose = vi.fn();
  render(
    <RoleDrawer
      tableName="project_costs_daily"
      columns={COLUMNS}
      isSystem={false}
      access={access}
      role="team-x"
      onClose={onClose}
      {...props}
    />,
  );

  return { access, onClose };
};

const card = (key: AnalyticsTableAccessI18nKey) => screen.getByRole('checkbox', { name: new RegExp(key) });
const saveButton = () => screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRole });

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

  test('offers neither the sensitive nor the rows step while only Write is selected', () => {
    renderDrawer(makeAccess({ write: ['team-x'] }));

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepSensitive)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepRows)).toBeNull();
  });

  test('offers the sensitive step once Modify is selected', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ write: ['team-x'] }));

    await user.click(card(AnalyticsTableAccessI18nKey.ColModify));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepSensitive)).toBeInTheDocument();
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

  test('shows neither scope note when its step is not offered', () => {
    renderDrawer(makeAccess({ write: ['team-x'] }));

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.SensitiveScope)).toBeNull();
    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RowsScope)).toBeNull();
  });

  test('names the sensitive columns of the table in the sensitive step', () => {
    renderDrawer();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.SensitiveIncludes)).toBeInTheDocument();
  });

  test('offers the rows step with All rows chosen for a role that has no policy', () => {
    renderDrawer();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepRows)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsAll })).toBeChecked();
    expect(screen.queryByText('set-limit')).toBeNull();
  });

  test('shows the row-limit editor, seeded with the stored policy, for a role that has one', () => {
    renderDrawer(makeAccess({ read: ['team-x'] }, { 'team-x': { filter: FILTER } }));

    expect(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsSome })).toBeChecked();
    expect(screen.getByText(`initial: ${JSON.stringify(FILTER)}`)).toBeInTheDocument();
  });

  test('locks Write and Modify on a system table with the reason, leaving Read and the rows step', () => {
    renderDrawer(makeAccess({ read: ['team-x'] }), { isSystem: true });

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
    expect(access.saveGrants).not.toHaveBeenCalled();
  });
});

describe('RoleDrawer — adding a role', () => {
  test('offers only roles that have no entry on the table, and keeps Save disabled until one is chosen', () => {
    renderDrawer(makeAccess({ read: ['team-x'] }), { role: null });

    expect(screen.getByRole('dialog', { name: AnalyticsTableAccessI18nKey.DrawerAddTitle })).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  test('shows no privilege step until a role is chosen', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ read: ['team-x'] }), { role: null });

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.StepAccess)).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));
    await user.click(screen.getByRole('option', { name: 'team-z' }));

    expect(screen.getByText(AnalyticsTableAccessI18nKey.StepAccess)).toBeInTheDocument();
    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeInTheDocument();
  });

  test('saves a newly chosen role with the selected privileges', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer(makeAccess({ read: ['team-x'] }), { role: null });

    await user.click(screen.getByRole('combobox', { name: AnalyticsTableAccessI18nKey.StepRole }));
    expect(screen.queryByRole('option', { name: 'team-x' })).toBeNull();
    await user.click(screen.getByRole('option', { name: 'team-z' }));
    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(saveButton());

    expect(access.saveGrants).toHaveBeenCalledWith('team-z', {
      get: false,
      read: true,
      write: false,
      modify: false,
      sensitive: false,
    });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});

describe('RoleDrawer — saving', () => {
  test('saves the grants, then the row limit, then notifies and closes', async () => {
    const user = userEvent.setup();
    const { access, onClose } = renderDrawer(makeAccess({ read: ['team-x'] }));

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsSome }));
    await user.click(screen.getByRole('button', { name: 'set-limit' }));
    await user.click(saveButton());

    expect(access.saveGrants).toHaveBeenCalledWith('team-x', expect.objectContaining({ read: true }));
    expect(access.saveRowPolicy).toHaveBeenCalledWith('team-x', FILTER);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessSaved }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('does not save while Only some rows is chosen and the predicate is empty', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ read: ['team-x'] }));

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsSome }));
    await user.click(screen.getByRole('button', { name: 'clear-limit' }));

    expect(saveButton()).toBeDisabled();
  });

  test('does not save while a condition of the predicate is unfinished', async () => {
    const user = userEvent.setup();
    renderDrawer(makeAccess({ read: ['team-x'] }));

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsSome }));
    await user.click(screen.getByRole('button', { name: 'set-incomplete-limit' }));

    expect(saveButton()).toBeDisabled();
  });

  test('removes an existing policy when All rows is chosen', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(makeAccess({ read: ['team-x'] }, { 'team-x': { filter: FILTER } }));

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsAll }));
    await user.click(saveButton());

    expect(access.saveRowPolicy).toHaveBeenCalledWith('team-x', null);
  });

  test('leaves the row policy alone when Read is turned off', async () => {
    const user = userEvent.setup();
    const { access } = renderDrawer(
      makeAccess({ read: ['team-x'], write: ['team-x'] }, { 'team-x': { filter: FILTER } }),
    );

    await user.click(card(AnalyticsTableAccessI18nKey.ColRead));
    await user.click(saveButton());

    expect(access.saveGrants).toHaveBeenCalledWith('team-x', expect.objectContaining({ read: false }));
    expect(access.saveRowPolicy).not.toHaveBeenCalled();
  });

  test('stays open and sends no row limit when the grants fail', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    access.saveGrants.mockResolvedValue({ isOk: false });
    const { onClose } = renderDrawer(access);

    await user.click(saveButton());

    expect(access.saveRowPolicy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(saveButton()).toBeEnabled();
  });
});

describe('RoleDrawer — grants that change nothing', () => {
  const answer = {
    ineffective_grants: [
      {
        role: 'team-x',
        key: TableGrantKey.Read,
        reason: IneffectiveGrantReason.AlreadyGlobal,
        message: 'already global',
      },
    ],
  };

  test('stays open with a banner inside the Read card, and offers Done instead of Save', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    access.saveGrants.mockResolvedValue({ isOk: true, result: answer });
    const { onClose } = renderDrawer(access);

    await user.click(saveButton());

    expect(screen.getByRole('status')).toHaveTextContent('already global');
    expect(screen.queryByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRole })).toBeNull();
    expect(showNotification).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('locks the steps once saved and closes without a request on Done', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    access.saveGrants.mockResolvedValue({ isOk: true, result: answer });
    const { onClose } = renderDrawer(access);
    await user.click(saveButton());

    expect(card(AnalyticsTableAccessI18nKey.ColRead)).toBeDisabled();
    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.Done }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(access.saveGrants).toHaveBeenCalledOnce();
  });

  test('still saves the row limit beside the banner', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    access.saveGrants.mockResolvedValue({ isOk: true, result: answer });
    renderDrawer(access);

    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsSome }));
    await user.click(screen.getByRole('button', { name: 'set-limit' }));
    await user.click(saveButton());

    expect(access.saveRowPolicy).toHaveBeenCalledWith('team-x', FILTER);
  });

  test('puts a banner for the clearance inside the sensitive step', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    access.saveGrants.mockResolvedValue({
      isOk: true,
      result: {
        ineffective_grants: [
          {
            role: 'team-x',
            key: TableGrantKey.Sensitive,
            reason: IneffectiveGrantReason.SensitiveWithoutVerb,
            message: 'no verb',
          },
        ],
      },
    });
    renderDrawer(access);

    await user.click(saveButton());

    expect(screen.getByText('no verb')).toBeInTheDocument();
  });
});

describe('RoleDrawer — a refused row limit', () => {
  const refuse = (access: ReturnType<typeof makeAccess>) =>
    access.saveRowPolicy.mockResolvedValueOnce({ isOk: false, errorMessage: 'project_id is not a column' });

  const saveWithLimit = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('radio', { name: AnalyticsTableAccessI18nKey.RowsSome }));
    await user.click(screen.getByRole('button', { name: 'set-limit' }));
    await user.click(saveButton());
  };

  test('keeps the drawer open and offers to repeat only the row limit', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    refuse(access);
    const { onClose } = renderDrawer(access);

    await saveWithLimit(user);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRowLimit })).toBeEnabled();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.RowLimitPending)).toBeInTheDocument();
  });

  test('hands the named field to the editor for marking', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    refuse(access);
    renderDrawer(access);

    await saveWithLimit(user);

    expect(screen.getByText('highlighted: project_id')).toBeInTheDocument();
  });

  test('repeats only the row-policy request, then notifies and closes', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    refuse(access);
    const { onClose } = renderDrawer(access);
    await saveWithLimit(user);

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRowLimit }));

    expect(access.saveGrants).toHaveBeenCalledOnce();
    expect(access.saveRowPolicy).toHaveBeenCalledTimes(2);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.RowLimitSaved }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('keeps offering Save row limit when the repeat is refused too', async () => {
    const user = userEvent.setup();
    const access = makeAccess({ read: ['team-x'] });
    access.saveRowPolicy.mockResolvedValue({ isOk: false, errorMessage: 'still wrong' });
    const { onClose } = renderDrawer(access);
    await saveWithLimit(user);

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRowLimit }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.SaveRowLimit })).toBeInTheDocument();
  });
});

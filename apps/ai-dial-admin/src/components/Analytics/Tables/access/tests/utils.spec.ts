import { describe, expect, test } from 'vitest';

import {
  ColumnsMode,
  EntryDraft,
  PrivilegeMark,
  RoleSelection,
  RowsCellKind,
  RowsMode,
} from '@/src/components/Analytics/Tables/access/models';
import {
  buildEntry,
  buildRoleRows,
  hasAnyPrivilege,
  isColumnsStepOffered,
  isEntryEmpty,
  isGetHeld,
  isOpenToEveryone,
  isRowsStepOffered,
  isSensitiveStepOffered,
  roleLabel,
  selectionFromEntry,
  summarizeFilter,
} from '@/src/components/Analytics/Tables/access/utils';
import {
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryOperator,
  QueryValueType,
} from '@/src/models/analytics/query';
import {
  IneffectiveGrant,
  IneffectiveGrantReason,
  TableAccessEntry,
  TableGrantKey,
} from '@/src/models/analytics/table';

const entry = (privileges: TableGrantKey[], over: Partial<TableAccessEntry> = {}): TableAccessEntry => ({
  privileges,
  rows: null,
  columns: null,
  ...over,
});

const selection = (over: Partial<RoleSelection> = {}): RoleSelection => ({
  get: false,
  read: false,
  write: false,
  modify: false,
  sensitive: false,
  ...over,
});

const draft = (over: Partial<EntryDraft> = {}): EntryDraft => ({
  selection: selection(),
  rowsMode: RowsMode.All,
  filter: null,
  columnsMode: ColumnsMode.All,
  columns: [],
  ...over,
});

const warning = (role: string, message: string, over: Partial<IneffectiveGrant> = {}): IneffectiveGrant => ({
  key: TableGrantKey.Read,
  role,
  reason: IneffectiveGrantReason.AlreadyGlobal,
  message,
  ...over,
});

const field = (name: string) => ({ type: QueryExprType.Field as const, name });
const value = (v: string | null) => ({
  type: QueryExprType.Value as const,
  value_type: QueryValueType.String,
  value: v,
});
const eq = (name: string, v: string | null): QueryFilterNode => ({
  op: QueryOperator.Eq,
  args: [field(name), value(v)],
});

describe('buildRoleRows', () => {
  test('lists one row per role entry, sorted by name', () => {
    const rows = buildRoleRows(
      {
        'ingest-bot': entry([TableGrantKey.Write]),
        'Team-x': entry([TableGrantKey.Read]),
        analysts: entry([TableGrantKey.Sensitive]),
      },
      [],
    );

    expect(rows.map((row) => row.role)).toEqual(['analysts', 'ingest-bot', 'Team-x']);
  });

  test('marks a stored privilege as stored and get as implied by read', () => {
    const [row] = buildRoleRows({ 'team-x': entry([TableGrantKey.Read]) }, []);

    expect(row.marks).toEqual({
      get: PrivilegeMark.Implied,
      read: PrivilegeMark.Stored,
      write: PrivilegeMark.None,
      modify: PrivilegeMark.None,
    });
  });

  test('marks get as implied by modify', () => {
    const [row] = buildRoleRows({ editors: entry([TableGrantKey.Modify]) }, []);

    expect(row.marks.get).toBe(PrivilegeMark.Implied);
  });

  test('keeps a stored get as stored even when read also implies it', () => {
    const [row] = buildRoleRows({ 'team-x': entry([TableGrantKey.Get, TableGrantKey.Read]) }, []);

    expect(row.marks.get).toBe(PrivilegeMark.Stored);
  });

  test('does not imply read, write or modify from anything', () => {
    const [row] = buildRoleRows({ browsers: entry([TableGrantKey.Get]) }, []);

    expect(row.marks).toEqual({
      get: PrivilegeMark.Stored,
      read: PrivilegeMark.None,
      write: PrivilegeMark.None,
      modify: PrivilegeMark.None,
    });
  });

  test('flags a role whose entry holds the clearance', () => {
    const [row] = buildRoleRows({ pii: entry([TableGrantKey.Read, TableGrantKey.Sensitive]) }, []);

    expect(row.isSensitive).toBe(true);
  });

  test('reads all rows for a role that holds read and has no row limit', () => {
    const [row] = buildRoleRows({ pii: entry([TableGrantKey.Read]) }, []);

    expect(row.rowsKind).toBe(RowsCellKind.All);
    expect(row.filter).toBeUndefined();
  });

  test('cannot read rows for a role without read', () => {
    const [row] = buildRoleRows({ 'ingest-bot': entry([TableGrantKey.Write]) }, []);

    expect(row.rowsKind).toBe(RowsCellKind.None);
  });

  test('shows the row limit of a role that holds read', () => {
    const filter = eq('project_id', 'X-PRJ-1');
    const [row] = buildRoleRows({ 'team-x': entry([TableGrantKey.Read], { rows: { filter } }) }, []);

    expect(row.rowsKind).toBe(RowsCellKind.Policy);
    expect(row.filter).toBe(filter);
  });

  test('lists a role that holds only a row limit, with every mark neutral and the limit kept', () => {
    const filter = eq('a', 'b');
    const [row] = buildRoleRows({ lonely: entry([], { rows: { filter } }) }, []);

    expect(row.role).toBe('lonely');
    expect(Object.values(row.marks).every((mark) => mark === PrivilegeMark.None)).toBe(true);
    expect(row.rowsKind).toBe(RowsCellKind.None);
    expect(row.filter).toBe(filter);
  });

  test('keeps the row limit of a role that lost Read, as a role that cannot read rows', () => {
    const filter = eq('a', 'b');
    const [row] = buildRoleRows({ analysts: entry([TableGrantKey.Modify], { rows: { filter } }) }, []);

    expect(row.rowsKind).toBe(RowsCellKind.None);
    expect(row.filter).toBe(filter);
  });

  test('carries the column limit of a role and null for a role without one', () => {
    const rows = buildRoleRows(
      {
        limited: entry([TableGrantKey.Read], { columns: ['region', 'project_id'] }),
        open: entry([TableGrantKey.Read]),
      },
      [],
    );

    expect(rows.map((row) => row.columns)).toEqual([['region', 'project_id'], null]);
  });

  test('gives each role the messages of its own ineffective grants only', () => {
    const rows = buildRoleRows({ '*': entry([TableGrantKey.Read]), 'team-x': entry([TableGrantKey.Read]) }, [
      warning('*', 'everyone reads all rows', { reason: IneffectiveGrantReason.EveryoneReadsAllRows }),
      warning('team-x', 'already global'),
      warning('team-x', 'lifts column policies', { reason: IneffectiveGrantReason.LiftsColumnPolicies }),
      warning('absent', 'not listed'),
    ]);

    expect(rows.map((row) => [row.role, row.warnings])).toEqual([
      ['*', ['everyone reads all rows']],
      ['team-x', ['already global', 'lifts column policies']],
    ]);
  });

  test('returns no rows for a table with no entries', () => {
    expect(buildRoleRows({}, [])).toEqual([]);
  });
});

describe('selectionFromEntry', () => {
  test('reads each privilege the entry holds', () => {
    expect(selectionFromEntry(entry([TableGrantKey.Get, TableGrantKey.Read, TableGrantKey.Sensitive]))).toEqual(
      selection({ get: true, read: true, sensitive: true }),
    );
  });

  test('is empty for a role with no entry', () => {
    expect(selectionFromEntry()).toEqual(selection());
    expect(selectionFromEntry(undefined)).toEqual(selection());
  });
});

describe('selection rules', () => {
  test('holds get when it is stored or implied by read or modify', () => {
    expect(isGetHeld(selection({ get: true }))).toBe(true);
    expect(isGetHeld(selection({ read: true }))).toBe(true);
    expect(isGetHeld(selection({ modify: true }))).toBe(true);
    expect(isGetHeld(selection({ write: true }))).toBe(false);
  });

  test('offers the sensitive step only beside a verb that shows the table', () => {
    expect(isSensitiveStepOffered(selection(), false)).toBe(false);
    expect(isSensitiveStepOffered(selection({ write: true }), false)).toBe(false);
    expect(isSensitiveStepOffered(selection({ get: true }), false)).toBe(true);
    expect(isSensitiveStepOffered(selection({ modify: true }), false)).toBe(true);
  });

  test('offers the rows step only for read', () => {
    expect(isRowsStepOffered(selection({ get: true, write: true, modify: true }), false)).toBe(false);
    expect(isRowsStepOffered(selection({ read: true }), false)).toBe(true);
  });

  test('offers the columns step beside get, read or modify, and never for write alone', () => {
    expect(isColumnsStepOffered(selection({ get: true }), false)).toBe(true);
    expect(isColumnsStepOffered(selection({ read: true }), false)).toBe(true);
    expect(isColumnsStepOffered(selection({ modify: true }), false)).toBe(true);
    expect(isColumnsStepOffered(selection({ write: true }), false)).toBe(false);
    expect(isColumnsStepOffered(selection(), false)).toBe(false);
  });

  test('offers none of the sensitive, rows and columns steps on an enrichment table', () => {
    const held = selection({ get: true, read: true, modify: true });

    expect(isSensitiveStepOffered(held, true)).toBe(false);
    expect(isRowsStepOffered(held, true)).toBe(false);
    expect(isColumnsStepOffered(held, true)).toBe(false);
  });

  test('has a privilege when anything is held, the clearance included', () => {
    expect(hasAnyPrivilege(selection())).toBe(false);
    expect(hasAnyPrivilege(selection({ write: true }))).toBe(true);
    expect(hasAnyPrivilege(selection({ sensitive: true }))).toBe(true);
  });
});

describe('buildEntry', () => {
  const filter = eq('project_id', 'X-PRJ-1');

  test('lists the chosen privileges and never stores a get that read only implies', () => {
    const built = buildEntry(undefined, draft({ selection: selection({ read: true, sensitive: true }) }), false);

    expect(built).toEqual({ privileges: [TableGrantKey.Read, TableGrantKey.Sensitive], rows: null, columns: null });
  });

  test('sends the row limit and the column limit chosen in their steps', () => {
    const built = buildEntry(
      undefined,
      draft({
        selection: selection({ read: true }),
        rowsMode: RowsMode.Some,
        filter,
        columnsMode: ColumnsMode.Some,
        columns: ['region'],
      }),
      false,
    );

    expect(built).toEqual({ privileges: [TableGrantKey.Read], rows: { filter }, columns: ['region'] });
  });

  test('sends null rows and columns for All rows and All columns, dropping what was stored', () => {
    const stored = entry([TableGrantKey.Read], { rows: { filter }, columns: ['region'] });

    expect(buildEntry(stored, draft({ selection: selection({ read: true }) }), false)).toEqual(
      entry([TableGrantKey.Read]),
    );
  });

  test('sends null rows for Only some rows with no filter built', () => {
    const built = buildEntry(
      undefined,
      draft({ selection: selection({ read: true }), rowsMode: RowsMode.Some }),
      false,
    );

    expect(built.rows).toBeNull();
  });

  test('keeps the stored rows while the row step is hidden', () => {
    const stored = entry([TableGrantKey.Read], { rows: { filter } });
    const built = buildEntry(stored, draft({ selection: selection({ modify: true }) }), false);

    expect(built).toEqual({ privileges: [TableGrantKey.Modify], rows: { filter }, columns: null });
  });

  test('keeps the stored columns while the column step is hidden', () => {
    const stored = entry([TableGrantKey.Read], { columns: ['region'] });
    const built = buildEntry(
      stored,
      draft({ selection: selection({ write: true }), columnsMode: ColumnsMode.Some, columns: ['other'] }),
      false,
    );

    expect(built).toEqual({ privileges: [TableGrantKey.Write], rows: null, columns: ['region'] });
  });

  test('sends null rows and columns for a new role whose steps are hidden', () => {
    expect(buildEntry(undefined, draft({ selection: selection({ write: true }) }), false)).toEqual(
      entry([TableGrantKey.Write]),
    );
  });

  test('keeps a column name the table no longer has', () => {
    const built = buildEntry(
      entry([TableGrantKey.Read], { columns: ['region', 'dropped_column'] }),
      draft({
        selection: selection({ read: true }),
        columnsMode: ColumnsMode.Some,
        columns: ['region', 'dropped_column'],
      }),
      false,
    );

    expect(built.columns).toEqual(['region', 'dropped_column']);
  });

  test('holds only write and modify with null rows and columns on an enrichment table', () => {
    const stored = entry([TableGrantKey.Read], { rows: { filter }, columns: ['region'] });
    const built = buildEntry(
      stored,
      draft({
        selection: selection({ get: true, read: true, sensitive: true, write: true, modify: true }),
        rowsMode: RowsMode.Some,
        filter,
        columnsMode: ColumnsMode.Some,
        columns: ['region'],
      }),
      true,
    );

    expect(built).toEqual({ privileges: [TableGrantKey.Write, TableGrantKey.Modify], rows: null, columns: null });
  });
});

describe('isOpenToEveryone', () => {
  test('is true for an entry that holds read with no row limit', () => {
    expect(isOpenToEveryone(entry([TableGrantKey.Read]))).toBe(true);
  });

  test('is false for a read confined by a row limit, an entry without read and a missing entry', () => {
    expect(isOpenToEveryone(entry([TableGrantKey.Read], { rows: { filter: eq('a', 'b') } }))).toBe(false);
    expect(isOpenToEveryone(entry([TableGrantKey.Get]))).toBe(false);
    expect(isOpenToEveryone()).toBe(false);
  });
});

describe('isEntryEmpty', () => {
  test('is true only when no privilege, row limit or column limit is left', () => {
    expect(isEntryEmpty(entry([]))).toBe(true);
    expect(isEntryEmpty(entry([TableGrantKey.Get]))).toBe(false);
    expect(isEntryEmpty(entry([], { rows: { filter: eq('a', 'b') } }))).toBe(false);
    expect(isEntryEmpty(entry([], { columns: ['region'] }))).toBe(false);
  });
});

describe('summarizeFilter', () => {
  test('reads a comparison as field, operator and value', () => {
    expect(summarizeFilter(eq('project_id', 'X-PRJ-1'))).toBe('project_id = X-PRJ-1');
  });

  test('reads an in-list with its values', () => {
    const filter: QueryFilterNode = {
      op: QueryOperator.In,
      args: [field('project_id'), { type: QueryExprType.Array, items: [value('A'), value('B')] }],
    };

    expect(summarizeFilter(filter)).toBe('project_id in A, B');
  });

  test('reads a null value as null', () => {
    expect(summarizeFilter(eq('region', null))).toBe('region = null');
  });

  test('joins group members with the logical operator', () => {
    const filter: QueryFilterNode = { op: QueryLogicalOperator.And, args: [eq('a', '1'), eq('b', '2')] };

    expect(summarizeFilter(filter)).toBe('a = 1 and b = 2');
  });

  test('parenthesizes a nested group with several members', () => {
    const filter: QueryFilterNode = {
      op: QueryLogicalOperator.And,
      args: [eq('a', '1'), { op: QueryLogicalOperator.Or, args: [eq('b', '2'), eq('c', '3')] }],
    };

    expect(summarizeFilter(filter)).toBe('a = 1 and (b = 2 or c = 3)');
  });

  test('prefixes a negated group with not', () => {
    const filter: QueryFilterNode = { op: QueryLogicalOperator.Not, args: [eq('a', '1')] };

    expect(summarizeFilter(filter)).toBe('not a = 1');
  });

  test('reads a function call with its arguments', () => {
    const filter: QueryFilterNode = {
      op: QueryOperator.Ge,
      args: [field('t'), { type: QueryExprType.Fn, name: 'now', args: [] }],
    };

    expect(summarizeFilter(filter)).toBe('t ≥ now()');
  });
});

describe('summarizeFilter — caller values', () => {
  const field = { type: QueryExprType.Field as const, name: 'project_id' };
  const param = { type: QueryExprType.Param as const, name: 'caller.project' };

  test.each([
    ['on the right', [field, param], 'project_id = caller.project'],
    ['on the left', [param, field], 'caller.project = project_id'],
  ])('names the caller value %s', (_name, args, expected) => {
    expect(summarizeFilter({ op: QueryOperator.Eq, args })).toBe(expected);
  });
});

describe('roleLabel', () => {
  test('labels the everyone grantee and leaves a provider role as its name', () => {
    expect(roleLabel('*', 'Everyone')).toBe('Everyone');
    expect(roleLabel('team-x', 'Everyone')).toBe('team-x');
  });
});

import { describe, expect, test } from 'vitest';

import { PrivilegeMark, RoleSelection, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import {
  applyAccessResult,
  buildRoleRows,
  emptyAccess,
  hasAnyPrivilege,
  isGetHeld,
  isRowsStepOffered,
  isSensitiveStepOffered,
  normalizeAccess,
  planAccessSave,
  planRoleRemoval,
  selectionFromAccess,
  summarizeFilter,
} from '@/src/components/Analytics/Tables/access/utils';
import {
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryOperator,
  QueryValueType,
} from '@/src/models/analytics/query';
import { TableAccess } from '@/src/models/analytics/table';

const access = (over: Partial<TableAccess> = {}): TableAccess => ({ ...emptyAccess(), ...over });

const selection = (over: Partial<RoleSelection> = {}): RoleSelection => ({
  get: false,
  read: false,
  write: false,
  modify: false,
  sensitive: false,
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
  test('lists one row per role named by any grant list, sorted by name', () => {
    const rows = buildRoleRows(access({ write: ['ingest-bot'], read: ['Team-x'], sensitive: ['analysts'] }), {});

    expect(rows.map((row) => row.role)).toEqual(['analysts', 'ingest-bot', 'Team-x']);
  });

  test('marks a stored privilege as stored and get as implied by read', () => {
    const [row] = buildRoleRows(access({ read: ['team-x'] }), {});

    expect(row.marks).toEqual({
      get: PrivilegeMark.Implied,
      read: PrivilegeMark.Stored,
      write: PrivilegeMark.None,
      modify: PrivilegeMark.None,
    });
  });

  test('marks get as implied by modify', () => {
    const [row] = buildRoleRows(access({ modify: ['editors'] }), {});

    expect(row.marks.get).toBe(PrivilegeMark.Implied);
  });

  test('keeps a stored get as stored even when read also implies it', () => {
    const [row] = buildRoleRows(access({ get: ['team-x'], read: ['team-x'] }), {});

    expect(row.marks.get).toBe(PrivilegeMark.Stored);
  });

  test('does not imply read, write or modify from anything', () => {
    const [row] = buildRoleRows(access({ get: ['browsers'] }), {});

    expect(row.marks).toEqual({
      get: PrivilegeMark.Stored,
      read: PrivilegeMark.None,
      write: PrivilegeMark.None,
      modify: PrivilegeMark.None,
    });
  });

  test('flags a role in the sensitive list', () => {
    const rows = buildRoleRows(access({ read: ['pii'], sensitive: ['pii'] }), {});

    expect(rows[0].isSensitive).toBe(true);
  });

  test('reads all rows for a role that holds read and has no policy', () => {
    const [row] = buildRoleRows(access({ read: ['pii'] }), {});

    expect(row.rowsKind).toBe(RowsCellKind.All);
    expect(row.filter).toBeUndefined();
  });

  test('cannot read rows for a role without read and without a policy', () => {
    const [row] = buildRoleRows(access({ write: ['ingest-bot'] }), {});

    expect(row.rowsKind).toBe(RowsCellKind.None);
  });

  test('shows the policy filter for a role that has one', () => {
    const filter = eq('project_id', 'X-PRJ-1');
    const [row] = buildRoleRows(access({ read: ['team-x'] }), { 'team-x': { filter } });

    expect(row.rowsKind).toBe(RowsCellKind.Policy);
    expect(row.filter).toBe(filter);
  });

  test('lists a role that has only a policy, with every mark neutral', () => {
    const [row] = buildRoleRows(access(), { lonely: { filter: eq('a', 'b') } });

    expect(row.role).toBe('lonely');
    expect(Object.values(row.marks).every((mark) => mark === PrivilegeMark.None)).toBe(true);
    expect(row.rowsKind).toBe(RowsCellKind.Policy);
  });

  test('returns no rows for an empty table', () => {
    expect(buildRoleRows(access(), {})).toEqual([]);
  });
});

describe('normalizeAccess', () => {
  test('fills every missing list with an empty array', () => {
    expect(normalizeAccess({ write: ['w'] })).toEqual(access({ write: ['w'] }));
  });

  test('turns a missing response into empty lists', () => {
    expect(normalizeAccess(undefined)).toEqual(emptyAccess());
    expect(normalizeAccess(null)).toEqual(emptyAccess());
  });
});

describe('selectionFromAccess', () => {
  test('reads the role membership of each list', () => {
    const lists = access({ get: ['r'], read: ['r'], sensitive: ['r'], write: ['other'] });

    expect(selectionFromAccess(lists, 'r')).toEqual(
      selection({ get: true, read: true, sensitive: true, write: false, modify: false }),
    );
  });

  test('is empty for a new role', () => {
    expect(selectionFromAccess(access({ read: ['r'] }))).toEqual(selection());
    expect(selectionFromAccess(access({ read: ['r'] }), '')).toEqual(selection());
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
    expect(isSensitiveStepOffered(selection())).toBe(false);
    expect(isSensitiveStepOffered(selection({ write: true }))).toBe(false);
    expect(isSensitiveStepOffered(selection({ get: true }))).toBe(true);
    expect(isSensitiveStepOffered(selection({ modify: true }))).toBe(true);
  });

  test('offers the rows step only for read', () => {
    expect(isRowsStepOffered(selection({ get: true, write: true, modify: true }))).toBe(false);
    expect(isRowsStepOffered(selection({ read: true }))).toBe(true);
  });

  test('has a privilege when anything is held, the clearance included', () => {
    expect(hasAnyPrivilege(selection())).toBe(false);
    expect(hasAnyPrivilege(selection({ write: true }))).toBe(true);
    expect(hasAnyPrivilege(selection({ sensitive: true }))).toBe(true);
  });
});

describe('planAccessSave', () => {
  test('adds the role to a list it joins, keeping every other grantee', () => {
    const plan = planAccessSave(access({ read: ['team-x', 'pii'] }), 'team-z', selection({ read: true }));

    expect(plan).toEqual({ read: ['team-x', 'pii', 'team-z'] });
  });

  test('sends only the keys whose membership changed', () => {
    const plan = planAccessSave(access({ read: ['team-x'], write: ['team-x'] }), 'team-x', selection({ read: true }));

    expect(plan).toEqual({ write: [] });
  });

  test('removes the role from a list it leaves without touching other members', () => {
    const plan = planAccessSave(access({ write: ['a', 'team-x', 'b'] }), 'team-x', selection());

    expect(plan).toEqual({ write: ['a', 'b'] });
  });

  test('sends nothing when the selection matches what is stored', () => {
    const plan = planAccessSave(access({ read: ['team-x'] }), 'team-x', selection({ read: true }));

    expect(plan).toEqual({});
  });

  test('does not store get when read only implies it', () => {
    const plan = planAccessSave(access(), 'team-x', selection({ read: true }));

    expect(plan).toEqual({ read: ['team-x'] });
  });

  test('stores the clearance in its own list', () => {
    const plan = planAccessSave(access({ read: ['team-x'] }), 'team-x', selection({ read: true, sensitive: true }));

    expect(plan).toEqual({ sensitive: ['team-x'] });
  });
});

describe('planRoleRemoval', () => {
  test('returns only the lists that name the role, each without it', () => {
    const plan = planRoleRemoval(access({ read: ['team-x', 'other'], write: ['team-x'], modify: ['other'] }), 'team-x');

    expect(plan).toEqual({ read: ['other'], write: [] });
  });

  test('returns nothing for a role no list names', () => {
    expect(planRoleRemoval(access({ read: ['other'] }), 'team-x')).toEqual({});
  });
});

describe('applyAccessResult', () => {
  test('replaces the lists the answer carries and keeps the rest', () => {
    const merged = applyAccessResult(access({ read: ['a'], write: ['b'] }), { read: ['a', 'c'] });

    expect(merged).toEqual(access({ read: ['a', 'c'], write: ['b'] }));
  });

  test('ignores lists the answer omits', () => {
    expect(applyAccessResult(access({ read: ['a'] }), {})).toEqual(access({ read: ['a'] }));
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

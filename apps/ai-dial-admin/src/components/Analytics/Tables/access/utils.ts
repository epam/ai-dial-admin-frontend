import { ALL_GRANT_KEYS } from '@/src/components/Analytics/Tables/access/constants';
import {
  MarkedPrivilege,
  PrivilegeMark,
  RoleRow,
  RoleSelection,
  RowsCellKind,
} from '@/src/components/Analytics/Tables/access/models';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryOperator,
  QueryPredicate,
} from '@/src/models/analytics/query';
import { RowPolicies, TableAccess, TableGrantKey } from '@/src/models/analytics/table';

export const emptyAccess = (): TableAccess => ({
  [TableGrantKey.Get]: [],
  [TableGrantKey.Read]: [],
  [TableGrantKey.Sensitive]: [],
  [TableGrantKey.Write]: [],
  [TableGrantKey.Modify]: [],
});

export const normalizeAccess = (access?: Partial<TableAccess> | null): TableAccess => ({
  ...emptyAccess(),
  ...Object.fromEntries(ALL_GRANT_KEYS.map((key) => [key, access?.[key] ?? []])),
});

const compareRoles = (a: string, b: string): number => a.localeCompare(b, undefined, { sensitivity: 'base' });

// Implication is derived when a check runs and never stored: `get` follows `read` and `modify`, nothing else
// follows anything.
const markOf = (key: MarkedPrivilege, role: string, access: TableAccess): PrivilegeMark => {
  if (access[key].includes(role)) return PrivilegeMark.Stored;

  const isImplied =
    key === TableGrantKey.Get &&
    (access[TableGrantKey.Read].includes(role) || access[TableGrantKey.Modify].includes(role));

  return isImplied ? PrivilegeMark.Implied : PrivilegeMark.None;
};

const rowsKindOf = (role: string, access: TableAccess, policies: RowPolicies): RowsCellKind => {
  if (policies[role]) return RowsCellKind.Policy;

  return access[TableGrantKey.Read].includes(role) ? RowsCellKind.All : RowsCellKind.None;
};

export const buildRoleRows = (access: TableAccess, policies: RowPolicies): RoleRow[] => {
  const roles = new Set<string>([...ALL_GRANT_KEYS.flatMap((key) => access[key]), ...Object.keys(policies)]);

  return Array.from(roles)
    .sort(compareRoles)
    .map((role) => ({
      role,
      marks: {
        [TableGrantKey.Get]: markOf(TableGrantKey.Get, role, access),
        [TableGrantKey.Read]: markOf(TableGrantKey.Read, role, access),
        [TableGrantKey.Write]: markOf(TableGrantKey.Write, role, access),
        [TableGrantKey.Modify]: markOf(TableGrantKey.Modify, role, access),
      },
      isSensitive: access[TableGrantKey.Sensitive].includes(role),
      rowsKind: rowsKindOf(role, access, policies),
      filter: policies[role]?.filter,
    }));
};

export const selectionFromAccess = (access: TableAccess, role?: string): RoleSelection => ({
  get: !!role && access[TableGrantKey.Get].includes(role),
  read: !!role && access[TableGrantKey.Read].includes(role),
  write: !!role && access[TableGrantKey.Write].includes(role),
  modify: !!role && access[TableGrantKey.Modify].includes(role),
  sensitive: !!role && access[TableGrantKey.Sensitive].includes(role),
});

export const isGetHeld = (selection: RoleSelection): boolean => selection.get || selection.read || selection.modify;

// The clearance authorizes nothing by itself, so it is offered only beside a verb that shows the table.
export const isSensitiveStepOffered = (selection: RoleSelection): boolean => isGetHeld(selection);

export const isRowsStepOffered = (selection: RoleSelection): boolean => selection.read;

export const hasAnyPrivilege = (selection: RoleSelection): boolean =>
  isGetHeld(selection) || selection.write || selection.sensitive;

// A key sent replaces that whole list, so each changed key carries every other grantee too.
export const planAccessSave = (access: TableAccess, role: string, selection: RoleSelection): Partial<TableAccess> => {
  const plan: Partial<TableAccess> = {};

  ALL_GRANT_KEYS.forEach((key) => {
    const isWanted = selection[key];
    const isHeld = access[key].includes(role);
    if (isWanted === isHeld) return;

    plan[key] = isWanted ? [...access[key], role] : access[key].filter((member) => member !== role);
  });

  return plan;
};

export const planRoleRemoval = (access: TableAccess, role: string): Partial<TableAccess> => {
  const plan: Partial<TableAccess> = {};

  ALL_GRANT_KEYS.forEach((key) => {
    if (access[key].includes(role)) plan[key] = access[key].filter((member) => member !== role);
  });

  return plan;
};

export const applyAccessResult = (access: TableAccess, result: Partial<TableAccess>): TableAccess => ({
  ...access,
  ...Object.fromEntries(ALL_GRANT_KEYS.filter((key) => result[key]).map((key) => [key, result[key]])),
});

const OPERATOR_SYMBOLS: Record<QueryOperator, string> = {
  [QueryOperator.Eq]: '=',
  [QueryOperator.Ne]: '≠',
  [QueryOperator.Co]: 'contains',
  [QueryOperator.Nc]: 'not contains',
  [QueryOperator.Ico]: 'contains',
  [QueryOperator.Inc]: 'not contains',
  [QueryOperator.Lt]: '<',
  [QueryOperator.Gt]: '>',
  [QueryOperator.Le]: '≤',
  [QueryOperator.Ge]: '≥',
  [QueryOperator.In]: 'in',
};

const summarizeExpr = (expr: QueryExpr): string => {
  switch (expr.type) {
    case QueryExprType.Field:
      return expr.name;
    case QueryExprType.Value:
      return expr.value ?? 'null';
    case QueryExprType.Array:
      return expr.items.map((item) => item.value ?? 'null').join(', ');
    default:
      return `${expr.name}(${expr.args.map(summarizeExpr).join(', ')})`;
  }
};

const isGroupNode = (node: QueryFilterNode): node is QueryGroup =>
  Object.values(QueryLogicalOperator).includes(node.op as QueryLogicalOperator);

export const summarizeFilter = (node: QueryFilterNode): string => {
  if (!isGroupNode(node)) {
    const { op, args } = node as QueryPredicate;
    const [left, right] = args;

    return [left && summarizeExpr(left), OPERATOR_SYMBOLS[op] ?? op, right && summarizeExpr(right)]
      .filter(Boolean)
      .join(' ');
  }

  const parts = node.args.map((child) => {
    const summary = summarizeFilter(child);

    return isGroupNode(child) && child.args.length > 1 ? `(${summary})` : summary;
  });

  if (node.op === QueryLogicalOperator.Not) return `not ${parts.join(' ')}`;

  return parts.join(` ${node.op} `);
};

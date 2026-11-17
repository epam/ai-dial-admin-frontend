import { ALL_GRANT_KEYS, EVERYONE_ROLE } from '@/src/components/Analytics/Tables/access/constants';
import {
  ColumnsMode,
  EntryDraft,
  MarkedPrivilege,
  PrivilegeMark,
  RoleRow,
  RoleSelection,
  RowsCellKind,
  RowsMode,
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
import { IneffectiveGrant, RowPolicy, TableAccessEntry, TableGrantKey } from '@/src/models/analytics/table';

export const roleLabel = (role: string, everyoneLabel: string): string =>
  role === EVERYONE_ROLE ? everyoneLabel : role;

const compareRoles = (a: string, b: string): number => a.localeCompare(b, undefined, { sensitivity: 'base' });

// Implication is derived when a check runs and never stored: `get` follows `read` and `modify`, nothing else
// follows anything.
const markOf = (key: MarkedPrivilege, privileges: TableGrantKey[]): PrivilegeMark => {
  if (privileges.includes(key)) return PrivilegeMark.Stored;

  const isImplied =
    key === TableGrantKey.Get && (privileges.includes(TableGrantKey.Read) || privileges.includes(TableGrantKey.Modify));

  return isImplied ? PrivilegeMark.Implied : PrivilegeMark.None;
};

const rowsKindOf = (entry: TableAccessEntry): RowsCellKind => {
  if (!entry.privileges.includes(TableGrantKey.Read)) return RowsCellKind.None;

  return entry.rows ? RowsCellKind.Policy : RowsCellKind.All;
};

export const buildRoleRows = (
  roles: Record<string, TableAccessEntry>,
  ineffectiveGrants: IneffectiveGrant[],
): RoleRow[] =>
  Object.keys(roles)
    .sort(compareRoles)
    .map((role) => {
      const entry = roles[role];

      return {
        role,
        marks: {
          [TableGrantKey.Get]: markOf(TableGrantKey.Get, entry.privileges),
          [TableGrantKey.Read]: markOf(TableGrantKey.Read, entry.privileges),
          [TableGrantKey.Write]: markOf(TableGrantKey.Write, entry.privileges),
          [TableGrantKey.Modify]: markOf(TableGrantKey.Modify, entry.privileges),
        },
        isSensitive: entry.privileges.includes(TableGrantKey.Sensitive),
        rowsKind: rowsKindOf(entry),
        filter: entry.rows?.filter,
        columns: entry.columns,
        warnings: ineffectiveGrants.filter((grant) => grant.role === role).map((grant) => grant.message),
      };
    });

export const selectionFromEntry = (entry?: TableAccessEntry): RoleSelection => ({
  get: !!entry?.privileges.includes(TableGrantKey.Get),
  read: !!entry?.privileges.includes(TableGrantKey.Read),
  write: !!entry?.privileges.includes(TableGrantKey.Write),
  modify: !!entry?.privileges.includes(TableGrantKey.Modify),
  sensitive: !!entry?.privileges.includes(TableGrantKey.Sensitive),
});

export const isGetHeld = (selection: RoleSelection): boolean => selection.get || selection.read || selection.modify;

// The clearance authorizes nothing by itself, so it is offered only beside a verb that shows the table.
export const isSensitiveStepOffered = (selection: RoleSelection, isEnrichment: boolean): boolean =>
  !isEnrichment && isGetHeld(selection);

export const isRowsStepOffered = (selection: RoleSelection, isEnrichment: boolean): boolean =>
  !isEnrichment && selection.read;

export const isColumnsStepOffered = (selection: RoleSelection, isEnrichment: boolean): boolean =>
  !isEnrichment && isGetHeld(selection);

export const hasAnyPrivilege = (selection: RoleSelection): boolean =>
  isGetHeld(selection) || selection.write || selection.sensitive;

export const isOpenToEveryone = (entry?: TableAccessEntry): boolean =>
  !!entry?.privileges.includes(TableGrantKey.Read) && !entry.rows;

const ENRICHMENT_PRIVILEGES: TableGrantKey[] = [TableGrantKey.Write, TableGrantKey.Modify];

const draftRows = ({ rowsMode, filter }: EntryDraft): RowPolicy | null =>
  rowsMode === RowsMode.Some && filter ? { filter } : null;

const draftColumns = ({ columnsMode, columns }: EntryDraft): string[] | null =>
  columnsMode === ColumnsMode.Some ? columns : null;

export const buildEntry = (
  stored: TableAccessEntry | undefined,
  draft: EntryDraft,
  isEnrichment: boolean,
): TableAccessEntry => {
  const privileges = ALL_GRANT_KEYS.filter((key) => draft.selection[key]);

  if (isEnrichment) {
    return {
      privileges: privileges.filter((key) => ENRICHMENT_PRIVILEGES.includes(key)),
      rows: null,
      columns: null,
    };
  }

  return {
    privileges,
    rows: isRowsStepOffered(draft.selection, false) ? draftRows(draft) : (stored?.rows ?? null),
    columns: isColumnsStepOffered(draft.selection, false) ? draftColumns(draft) : (stored?.columns ?? null),
  };
};

export const isEntryEmpty = (entry: TableAccessEntry): boolean =>
  !entry.privileges.length && !entry.rows && !entry.columns;

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
    case QueryExprType.Param:
      return expr.name;
    case QueryExprType.Value:
      return expr.value ?? 'null';
    case QueryExprType.Array:
      return expr.items.map((item) => item.value ?? 'null').join(', ');
    default:
      return `${expr.name}(${(expr.args ?? []).map(summarizeExpr).join(', ')})`;
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

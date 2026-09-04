import { IMPLICIT_COUNT_ALIAS, UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  ComputedRow,
  ExpressionRow,
  FieldOption,
  FieldOptionGroup,
  FnArgValue,
  GroupByRow,
  QueryBuilderState,
} from '@/src/models/analytics/query-builder';
import { QueryMode, QueryValueType } from '@/src/models/analytics/query';
import { QueryFunction } from '@/src/models/analytics/query-function';
import {
  functionByName,
  functionLabel,
  functionResultType,
  implicitMeasureFunction,
  isExpressionArg,
  requiredArgsFilled,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';

export const family = (name: string): string => {
  const i = name.indexOf(':');
  return i === -1 ? 'column' : name.slice(0, i);
};

export const typeOf = (fields: AnalyticsEntityField[], name: string): string | undefined =>
  fields.find((f) => f.name === name)?.type;

export const fieldDisplayName = (fields: Pick<AnalyticsEntityField, 'name' | 'display_name'>[], name: string): string =>
  fields.find((f) => f.name === name)?.display_name || name;

export const defaultValueType = (fieldType?: string): QueryValueType => {
  switch (fieldType) {
    case AnalyticsFieldType.Uuid:
      return QueryValueType.Uuid;
    case AnalyticsFieldType.Integer:
      return QueryValueType.Integer;
    case AnalyticsFieldType.Long:
      return QueryValueType.Long;
    case AnalyticsFieldType.Decimal:
      return QueryValueType.Decimal;
    case AnalyticsFieldType.Boolean:
      return QueryValueType.Boolean;
    case AnalyticsFieldType.Date:
      return QueryValueType.Date;
    case AnalyticsFieldType.Timestamp:
      return QueryValueType.Timestamp;
    default:
      return QueryValueType.String;
  }
};

export const sortByName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

export const tagOf = (field: AnalyticsEntityField): string => field.tag || UNTAGGED_KEY;

export const distinctTags = (fields: AnalyticsEntityField[]): string[] => {
  const seen = new Set<string>();
  const tags: string[] = [];
  fields.forEach((f) => {
    const tag = tagOf(f);
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  });
  return tags;
};

export const filterFieldsByTags = (fields: AnalyticsEntityField[], selectedTags: string[]): AnalyticsEntityField[] => {
  if (!selectedTags.length) return fields;
  const selected = new Set(selectedTags);
  return fields.filter((f) => selected.has(tagOf(f)));
};

// Groups options by tag for the categorized dropdown, preserving first-seen tag order. Untagged
// options land in a group keyed UNTAGGED_KEY; a search term filters by name, display name, and tag
// beforehand.
export const groupFieldOptions = (options: FieldOption[], search = ''): FieldOptionGroup[] => {
  const term = search.trim().toLowerCase();
  const visible = term
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(term) ||
          (o.display_name || '').toLowerCase().includes(term) ||
          (o.tag || '').toLowerCase().includes(term),
      )
    : options;
  const groups = new Map<string, FieldOption[]>();
  visible.forEach((o) => {
    const tag = o.tag || UNTAGGED_KEY;
    const bucket = groups.get(tag);
    if (bucket) bucket.push(o);
    else groups.set(tag, [o]);
  });
  return [...groups.entries()].map(([tag, opts]) => ({ tag, options: sortByName(opts) }));
};

export const fieldsToOptions = (fields: AnalyticsEntityField[]): FieldOption[] =>
  fields.map((f) => ({
    name: f.name,
    type: f.type,
    tag: f.tag,
    display_name: f.display_name,
    description: f.description,
    sensitive: f.sensitive,
  }));

// The alias a computed row (aggregate / group-by function) is prefilled with. The alias is that
// column's only name — the backend rejects a computed output column without one, and Sort and Having
// can address it only by that name — so it is derived rather than left to the user: the first
// expression argument's display name carries the meaning, the function's label (with `distinct` folded
// in) says what was done to it. A row with no filled expression argument falls back to that label
// alone so it is addressable from the moment it is added.
export const deriveAlias = (
  fn: QueryFunction,
  args: FnArgValue[],
  distinct: boolean,
  fields: Pick<AnalyticsEntityField, 'name' | 'display_name'>[],
): string => {
  const label = functionLabel(fn);
  const exprIndex = fn.args.findIndex(isExpressionArg);
  const fieldName = exprIndex >= 0 ? args[exprIndex]?.field : undefined;
  if (!fieldName) return label;
  const operation = distinct ? `${label} distinct` : label;
  return `${fieldDisplayName(fields, fieldName)} (${operation})`;
};

// Duplicate output column names collapse into one another in the result rows and make a sort key
// ambiguous, so a derived alias that is already taken gains a counter. A user-typed alias is left
// exactly as typed — this only guards names the builder chooses itself.
export const uniqueAlias = (candidate: string, taken: string[]): string => {
  const used = new Set(taken);
  if (!used.has(candidate)) return candidate;
  let suffix = 2;
  while (used.has(`${candidate} ${suffix}`)) suffix += 1;
  return `${candidate} ${suffix}`;
};

const fnRowsOf = (rows: ExpressionRow[], functions: QueryFunction[]): ComputedRow[] =>
  rows.flatMap((row) => {
    if (!row.fn) return [];
    const fn = functionByName(functions, row.fn);
    if (!fn || !requiredArgsFilled(fn, row.args)) return [];
    return [{ id: row.id, fn, args: row.args, distinct: false, alias: row.alias, aliasEdited: row.aliasEdited }];
  });

// The computed rows the query will actually carry a column for, in the order the serializer emits
// them. The two modes never contribute at once: `row` mode computes only through its projection,
// `aggregate` mode through its group-by function entries followed by every aggregate.
const computedRows = (state: QueryBuilderState): ComputedRow[] => {
  if (state.mode === QueryMode.Row) return fnRowsOf(state.select, state.functions);
  const rows = fnRowsOf(state.groupBy, state.functions);
  state.aggregates.forEach((a) => {
    const fn = functionByName(state.functions, a.fn);
    if (!fn) return;
    rows.push({ id: a.id, fn, args: a.args, distinct: a.distinct, alias: a.alias, aliasEdited: a.aliasEdited });
  });
  return rows;
};

const plainColumnNames = (state: QueryBuilderState): string[] =>
  (state.mode === QueryMode.Row ? state.select : state.groupBy).filter((r) => !r.fn && r.field).map((r) => r.field);

// The single source of truth for what each computed column is called: row id → output name. Every
// path — the alias prefill, the Having/Sort options, and serialization — resolves names through this
// one function, so a column is offered under exactly the name the query will carry and the name shown
// in the row's alias input. A row's own alias is that name (a duplicate the user typed included —
// their choice); a blank one falls back to the derived name, kept unique against the names already
// assigned — the active mode's plain columns included.
export const computedColumnNames = (state: QueryBuilderState, exceptRowId?: string): Map<string, string> => {
  const names = new Map<string, string>();
  const assigned = plainColumnNames(state);
  computedRows(state).forEach((row) => {
    if (row.id === exceptRowId) return;
    const name = row.alias.trim() || uniqueAlias(deriveAlias(row.fn, row.args, row.distinct, state.fields), assigned);
    assigned.push(name);
    names.set(row.id, name);
  });
  return names;
};

// Every output column name the query already uses. `exceptRowId` leaves one row out so rederiving
// that row's own name does not collide with itself.
export const takenColumnNames = (state: QueryBuilderState, exceptRowId?: string): string[] => [
  ...plainColumnNames(state),
  ...computedColumnNames(state, exceptRowId).values(),
];

export const prefilledAlias = (
  state: QueryBuilderState,
  fn: QueryFunction,
  args: FnArgValue[],
  distinct: boolean,
  exceptRowId?: string,
): string => uniqueAlias(deriveAlias(fn, args, distinct, state.fields), takenColumnNames(state, exceptRowId));

const plainColumnOption = (state: QueryBuilderState, row: GroupByRow): FieldOption | null => {
  if (!row.field) return null;
  // Plain group-by columns keep their schema display name/description so the Having/Sort pickers
  // can display them; function rows are alias-only and carry neither.
  const field = state.fields.find((f) => f.name === row.field);
  return { name: row.field, type: field?.type, display_name: field?.display_name, description: field?.description };
};

// A computed column as a picker option, typed by what its function returns — except an aggregate (or
// a distinct one), whose measure is numeric whatever its argument was.
const computedColumnOptions = (state: QueryBuilderState): FieldOption[] => {
  const names = computedColumnNames(state);
  return computedRows(state).map((row) => ({
    name: names.get(row.id) ?? '',
    type:
      row.distinct || state.aggregates.some((a) => a.id === row.id)
        ? AnalyticsFieldType.Decimal
        : functionResultType(row.fn, row.args, state.fields),
  }));
};

export const havingFieldOptions = (state: QueryBuilderState): FieldOption[] => {
  const plainColumns = state.groupBy
    .filter((g) => !g.fn)
    .map((g) => plainColumnOption(state, g))
    .filter((o): o is FieldOption => o !== null);
  const computed = computedColumnOptions(state);
  // Aggregate mode with no aggregates of its own still returns the implicit count column, so it is
  // offered here too — the option set mirrors the query's output columns, not just its authored rows.
  const implicit: FieldOption[] =
    !state.aggregates.length && implicitMeasureFunction(state.functions)
      ? [{ name: IMPLICIT_COUNT_ALIAS, type: AnalyticsFieldType.Long }]
      : [];
  return sortByName([...plainColumns, ...computed, ...implicit]);
};

export const sortFieldOptions = (state: QueryBuilderState): FieldOption[] => {
  // Keep tags so the categorized dropdown can group; alias options (a row-mode function column, or
  // any aggregate-mode output) carry none. A row-mode function column is sortable by its alias
  // because the service registers a projection alias as one of the query's output names.
  if (state.mode === QueryMode.Row) {
    return sortByName([...fieldsToOptions(state.fields), ...computedColumnOptions(state)]);
  }
  return havingFieldOptions(state);
};

import { SORT_NULLS_DEFAULT } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  AggregateRow,
  FilterGroupNode,
  FilterNode,
  FilterNodeKind,
  FilterOperandKind,
  FilterPredicateNode,
  FnArgValue,
  GroupByRow,
  PageState,
  QueryBuilderState,
  SelectRow,
  SortRow,
} from '@/src/models/analytics/query-builder';
import { QueryFunction, QueryFunctionArg, QueryFunctionGroup } from '@/src/models/analytics/query-function';
import {
  QueryExpr,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryOutputColumn,
  QueryPage,
  QueryPageType,
  QueryPredicate,
  QueryExprType,
  QueryValueExpr,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { functionByName, isExpressionArg } from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { deriveAlias, uniqueAlias } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  createAggregate,
  createGroup,
  createColumnRow,
  createFnRow,
  createInitialPage,
  createInitialState,
  nextId,
} from './state';

const LOGICAL_OPS = new Set<string>([QueryLogicalOperator.And, QueryLogicalOperator.Or, QueryLogicalOperator.Not]);

const isGroup = (node: QueryFilterNode): node is QueryGroup => LOGICAL_OPS.has((node as QueryGroup).op);

const parseFilterNode = (node: QueryFilterNode, functions: QueryFunction[]): FilterNode => {
  if (isGroup(node)) {
    const children = (node.args || []).map((child) => parseFilterNode(child, functions));
    if (
      node.op === QueryLogicalOperator.Not &&
      children.length === 1 &&
      children[0].kind === FilterNodeKind.Group &&
      (children[0] as FilterGroupNode).op === QueryLogicalOperator.And
    ) {
      return {
        id: nextId(),
        kind: FilterNodeKind.Group,
        op: QueryLogicalOperator.Not,
        children: (children[0] as FilterGroupNode).children,
      };
    }
    return { id: nextId(), kind: FilterNodeKind.Group, op: node.op, children };
  }

  const pred = node as QueryPredicate;
  const [left, right] = pred.args || [];
  const predicate: FilterPredicateNode = {
    id: nextId(),
    kind: FilterNodeKind.Predicate,
    field: left && left.type === QueryExprType.Field ? left.name : '',
    fn: null,
    args: [],
    op: pred.op,
    valueType: QueryValueType.String,
    value: '',
    isNull: false,
    rightKind: FilterOperandKind.Literal,
    rightFn: null,
    rightArgs: [],
  };

  // A function operand is shown as the call it is. One the catalog does not name cannot be shown at
  // all — such a query is not builder-representable, so it never reaches here.
  if (left?.type === QueryExprType.Fn) {
    const fn = functionByName(functions, left.name);
    if (fn) {
      predicate.fn = fn.name;
      predicate.args = argsToSlots(fn, left.args, functions);
    }
  }

  if (right?.type === QueryExprType.Fn) {
    const fn = functionByName(functions, right.name);
    if (fn) {
      predicate.rightKind = FilterOperandKind.Function;
      predicate.rightFn = fn.name;
      predicate.rightArgs = argsToSlots(fn, right.args, functions);
    }
  }

  if (right?.type === QueryExprType.Array) {
    const items = right.items || [];
    predicate.value = items.map((i) => i.value ?? '').join(', ');
    predicate.valueType = items[0]?.value_type ?? QueryValueType.String;
  } else if (right?.type === QueryExprType.Value) {
    if (right.value_type === QueryValueType.Null) {
      predicate.isNull = true;
    } else {
      predicate.value = right.value ?? '';
      predicate.valueType = right.value_type;
    }
  }

  return predicate;
};

// How deep the argument editor renders a call inside a call: one level. A deeper call has no editor,
// so a query carrying one stays in the written views rather than hydrating with it dropped.
const NESTED_CALL_MAX_DEPTH = 1;

// One function argument as the builder holds it: a literal for a literal argument, and for an
// `expression` argument a field reference or — within the nesting the editor renders — a call.
// Anything else, such as a constant where a column belongs, has no editor, so the row would come
// back missing that argument.
const isArgRepresentable = (
  argDef: QueryFunctionArg,
  expr: QueryExpr,
  functions: QueryFunction[],
  depth: number,
): boolean => {
  // A blank literal reads as unfilled, which drops the whole call (or, for an optional argument, the
  // argument) on the way back out.
  if (!isExpressionArg(argDef)) return expr.type === QueryExprType.Value && !!expr.value?.trim();
  if (expr.type === QueryExprType.Field) return true;
  return depth < NESTED_CALL_MAX_DEPTH && isExprRepresentable(expr, functions, depth + 1);
};

// An expression the builder can hold: a field reference, or a call to a served catalog function whose
// arguments line up with the ones that function declares — none beyond them (a variadic call carries
// more), and each of the kind its position expects. `depth` is how many calls this one already sits
// inside.
const isExprRepresentable = (expr: QueryExpr, functions: QueryFunction[] | null, depth = 0): boolean => {
  if (expr.type === QueryExprType.Field) return true;
  if (expr.type !== QueryExprType.Fn) return false;
  // Re-admitted for an aggregate metric by isSelectEntryRepresentable.
  if (expr.distinct) return false;
  // No catalog to check against — the caller is judging structure alone (see isBuilderRepresentable).
  if (!functions) return true;
  const fn = functionByName(functions, expr.name);
  if (!fn) return false;
  const args = expr.args || [];
  return args.length <= fn.args.length && args.every((arg, i) => isArgRepresentable(fn.args[i], arg, functions, depth));
};

// A condition the builder can hold: an expression on the left, and on the right a literal — one
// value, or an array of them for `in` — or a call, the right-hand shapes its editor produces. A
// field reference on the right is not among them: the condition editor compares against a value or
// a call, never against another column. `in` is the exception to the call: its right operand is a
// list of literals, so the editor returns it to a literal rather than offering a function, and a
// body pairing the two would reserialize as a predicate the service rejects.
//
// The editor holds exactly two operands, so a predicate with any other count would come back changed.
// An array belongs to `in` alone — under any other operator it would collapse into one literal — and
// `in` holds nothing but an array, since the editor would split a single value on its commas.
const isPredicateRepresentable = (pred: QueryPredicate, functions: QueryFunction[] | null): boolean => {
  const args = pred.args || [];
  if (args.length !== 2) return false;
  const [left, right] = args;
  if (!isExprRepresentable(left, functions)) return false;
  if (pred.op === QueryOperator.In) return right.type === QueryExprType.Array && isListRepresentable(right.items);
  if (right.type === QueryExprType.Value) return true;
  return right.type === QueryExprType.Fn && isExprRepresentable(right, functions);
};

// The `in` editor stores one value type for the whole list and splits its text on commas, trimming
// and skipping empty entries — so an item has to be a non-empty, trimmed value without a comma, and
// every item has to share the first one's type.
const isListRepresentable = (items: QueryValueExpr[] = []): boolean =>
  items.every(
    (item) =>
      item.type === QueryExprType.Value &&
      item.value_type === items[0].value_type &&
      typeof item.value === 'string' &&
      !!item.value &&
      item.value === item.value.trim() &&
      !item.value.includes(','),
  );

// A projection entry the builder can hold. A plain column has no alias editor in either mode, so it
// holds only its own name; a Distinct toggle exists only on an aggregate metric. Without a catalog
// the function's group is unknown, so an aggregate-mode `distinct` is taken at face value.
const isSelectEntryRepresentable = (
  col: QueryOutputColumn,
  mode: QueryMode,
  functions: QueryFunction[] | null,
): boolean => {
  const { expr } = col;
  if (expr.type === QueryExprType.Field) return !col.as?.trim() || col.as === expr.name;
  if (expr.type !== QueryExprType.Fn || !expr.distinct) return isExprRepresentable(expr, functions);
  if (mode !== QueryMode.Aggregate) return false;
  const fn = functions ? functionByName(functions, expr.name) : undefined;
  if (functions && fn?.group === QueryFunctionGroup.Scalar) return false;
  return isExprRepresentable({ ...expr, distinct: false }, functions);
};

// The visual builder shows at most two filter levels: the root group plus one level of nested groups
// holding only conditions. `depth` is the group nesting level of `node`'s parent.
const isFilterRepresentable = (node: QueryFilterNode, depth: number, functions: QueryFunction[] | null): boolean => {
  if (!isGroup(node)) return isPredicateRepresentable(node as QueryPredicate, functions);
  if (depth >= 2) return false;
  return (node.args || []).every((child) => isFilterRepresentable(child, depth + 1, functions));
};

// The names the service gives a select list's output columns, mirroring its OutputColumnNaming: an
// explicit alias reserves its name first, then a field takes its own name and a call its lowercase
// function name, each the first free of `base`, `base_1`, `base_2`, … These are the names a sort key,
// a group-by key or a having condition written against the query uses.
const serviceOutputNames = (select: QueryOutputColumn[]): string[] => {
  const taken = new Set<string>();
  const firstFree = (base: string): string => {
    let name = base;
    for (let n = 1; taken.has(name); n += 1) name = `${base}_${n}`;
    taken.add(name);
    return name;
  };
  const names: (string | null)[] = select.map((col) => (col.as?.trim() ? firstFree(col.as) : null));
  return select.map((col, i) => {
    const explicit = names[i];
    if (explicit !== null) return explicit;
    const { expr } = col;
    if (expr.type === QueryExprType.Field) return firstFree(expr.name);
    if (expr.type === QueryExprType.Fn) return firstFree(expr.name.toLowerCase());
    return firstFree(expr.type === QueryExprType.Array ? 'array' : '?column?');
  });
};

// Aggregate mode rebuilds its group-by keys from the select entries — every plain column and every
// scalar call is a key, every other call a metric — because that is the only shape a builder-authored
// query takes. So the two have to agree both ways: a key naming nothing in the select has nowhere to
// land, and a column or scalar call that is not a key would become one — a scalar call wrapping an
// aggregate (`round(avg(x))`) would then put an aggregate into GROUP BY. Without a catalog a call's group
// is unknown, so only plain columns are checked that way. In `row` mode there is no group-by section
// at all, so any key is unholdable.
const isGroupByRepresentable = (query: StructuredQuery, functions: QueryFunction[] | null): boolean => {
  const keys = new Set(query.group_by ?? []);
  if (query.mode !== QueryMode.Aggregate) return !keys.size;

  const select = query.select ?? [];
  const names = serviceOutputNames(select);
  const provided = new Set(names);
  if ([...keys].some((key) => !provided.has(key))) return false;
  return select.every((col, i) => {
    const { expr } = col;
    // The service keys a plain column by its field name, whatever the output column is called.
    if (expr.type === QueryExprType.Field) return keys.has(expr.name);
    const fn = functions && expr.type === QueryExprType.Fn ? functionByName(functions, expr.name) : undefined;
    return fn?.group !== QueryFunctionGroup.Scalar || keys.has(names[i]);
  });
};

// Whether the visual builder can show a query without losing part of it: filter (and having) trees no
// deeper than root + one group level, and every expression it would have to hold — projection entries
// and condition operands — one it has an editor for. A query it cannot show stays editable and
// runnable in the written views instead of being hydrated with pieces missing.
//
// `functions` is nullable because one caller has no catalog: the saved-queries grid labels which
// editor a query would open in without loading one. Passing null checks structure alone and takes a
// function call at face value — the grid can therefore label a query "Builder" that will open in
// JSON. The page that actually opens it passes the catalog and decides again with it.
export const isBuilderRepresentable = (query: StructuredQuery, functions: QueryFunction[] | null): boolean => {
  const filterOk = !query.filter || isFilterRepresentable(query.filter, 0, functions);
  const havingOk = !query.having || isFilterRepresentable(query.having, 0, functions);
  const selectOk = (query.select || []).every((col) => isSelectEntryRepresentable(col, query.mode, functions));
  // `row` mode has no Having section, so a having tree there would be dropped.
  const havingModeOk = !query.having || query.mode === QueryMode.Aggregate;
  return filterOk && havingOk && havingModeOk && selectOk && isGroupByRepresentable(query, functions);
};

// Having conditions name output columns, so a column the parse renamed has to be renamed in them too.
// One pass over the tree with a lookup, so a new name that happens to equal another old one is not
// renamed twice.
const renamedFieldRefs = (node: QueryFilterNode, renamed: (name: string) => string): QueryFilterNode => {
  if (isGroup(node)) return { ...node, args: (node.args || []).map((child) => renamedFieldRefs(child, renamed)) };
  const pred = node as QueryPredicate;
  return {
    ...pred,
    args: (pred.args || []).map((arg) =>
      arg.type === QueryExprType.Field ? { ...arg, name: renamed(arg.name) } : arg,
    ),
  };
};

const parseFilterRoot = (node?: QueryFilterNode, functions: QueryFunction[] = []): FilterGroupNode => {
  if (!node) return createGroup();
  const parsed = parseFilterNode(node, functions);
  if (parsed.kind === FilterNodeKind.Group) return parsed;
  const root = createGroup();
  root.children = [parsed];
  return root;
};

// Reverse a serialized function call's ordered args into row arg-value slots, matched positionally
// against the catalog function's argument list. `args` is typed as required but a hand-authored JSON
// call can omit it entirely — every slot is then simply empty.
const argsToSlots = (fn: QueryFunction, exprArgs: QueryExpr[] = [], functions: QueryFunction[] = []): FnArgValue[] =>
  fn.args.map((argDef, i) => {
    const argExpr = exprArgs[i];
    if (isExpressionArg(argDef)) return expressionSlot(argExpr, functions);
    return { literal: argExpr?.type === QueryExprType.Value ? (argExpr.value ?? '') : '' };
  });

// A call the catalog does not serve leaves the slot empty — representability already keeps such a
// query out of the builder.
const expressionSlot = (expr: QueryExpr | undefined, functions: QueryFunction[]): FnArgValue => {
  if (expr?.type === QueryExprType.Fn) {
    const nested = functionByName(functions, expr.name);
    if (nested) return { call: { fn: nested.name, args: argsToSlots(nested, expr.args, functions) } };
    return { field: '' };
  }
  return { field: expr?.type === QueryExprType.Field ? expr.name : '' };
};

// An authored alias belongs to whoever wrote the query: it is kept as-is and marked user-owned so
// the builder never rederives over it. A column that arrives without one is prefilled exactly as a
// freshly added row would be, so it is addressable from Sort (and Having) straight away — and since
// the query addressed it by the service's name for it, `renames` records that name's replacement.
// `assigned` accumulates the names already taken, so a derived one stays unique within the query.
const aliasFor = (
  fn: QueryFunction,
  slots: FnArgValue[],
  col: QueryOutputColumn,
  serviceName: string,
  distinct: boolean,
  fields: AnalyticsEntityField[],
  assigned: string[],
  renames: Map<string, string>,
): { alias: string; aliasEdited: boolean } => {
  const authored = (col.as ?? '').trim();
  const alias = authored || uniqueAlias(deriveAlias(fn, slots, distinct, fields), assigned);
  assigned.push(alias);
  if (!authored) renames.set(serviceName, alias);
  return { alias, aliasEdited: !!authored };
};

// Row-mode projection entries: a field expression becomes a column row, a served scalar function a
// function row under its alias. A function the catalog does not name cannot be shown at all — such a
// query is not builder-representable, so it never reaches here.
const parseRowSelect = (
  select: QueryOutputColumn[],
  functions: QueryFunction[],
  fields: AnalyticsEntityField[],
  renames: Map<string, string>,
): SelectRow[] => {
  const rows: SelectRow[] = [];
  const assigned: string[] = [];
  const serviceNames = serviceOutputNames(select);

  select.forEach((col, i) => {
    const expr = col.expr;
    if (expr.type === QueryExprType.Field) {
      rows.push(createColumnRow(expr.name));
      assigned.push(expr.name);
      return;
    }
    if (expr.type !== QueryExprType.Fn) return;
    const fn = functionByName(functions, expr.name);
    if (!fn) return;
    const slots = argsToSlots(fn, expr.args, functions);
    const { alias, aliasEdited } = aliasFor(fn, slots, col, serviceNames[i], false, fields, assigned, renames);
    rows.push({ ...createFnRow(fn, slots, alias), aliasEdited });
  });

  return rows;
};

const parseAggregateSelect = (
  select: QueryOutputColumn[],
  functions: QueryFunction[],
  fields: AnalyticsEntityField[],
  renames: Map<string, string>,
): { groupBy: GroupByRow[]; aggregates: AggregateRow[] } => {
  const groupBy: GroupByRow[] = [];
  const aggregates: AggregateRow[] = [];
  const assigned: string[] = [];
  const serviceNames = serviceOutputNames(select);

  select.forEach((col, i) => {
    const expr = col.expr;
    if (expr.type === QueryExprType.Field) {
      groupBy.push({ ...createColumnRow(expr.name), alias: col.as ?? '' });
      return;
    }
    if (expr.type !== QueryExprType.Fn) return;
    // A function absent from the served catalog cannot be shown in the builder — the query stays
    // editable in the JSON/SQL views; here we simply skip it.
    const fn = functionByName(functions, expr.name);
    if (!fn) return;
    const slots = argsToSlots(fn, expr.args, functions);
    const distinct = !!expr.distinct;
    const { alias, aliasEdited } = aliasFor(fn, slots, col, serviceNames[i], distinct, fields, assigned, renames);
    if (fn.group === QueryFunctionGroup.Scalar) {
      groupBy.push({ ...createFnRow(fn, slots, alias), aliasEdited });
    } else {
      aggregates.push({ ...createAggregate(fn, slots, alias), distinct, aliasEdited });
    }
  });

  return { groupBy, aggregates };
};

const parsePage = (page?: QueryPage): PageState => {
  const base = createInitialPage();
  if (!page) return { ...base, enabled: false };
  if (page.type === QueryPageType.Offset) {
    return {
      ...base,
      enabled: true,
      type: QueryPageType.Offset,
      offset: page.offset,
      limit: page.limit,
      includeTotal: page.include_total,
    };
  }
  return { ...base, enabled: true, type: QueryPageType.Cursor, cursor: page.cursor ?? '', cursorLimit: page.limit };
};

export const parseQuery = (
  query: StructuredQuery,
  fields: AnalyticsEntityField[],
  functions: QueryFunction[] = [],
): QueryBuilderState => {
  const state = createInitialState(functions);
  state.entityName = query.entity ?? '';
  state.fields = fields;
  state.mode = query.mode === QueryMode.Aggregate ? QueryMode.Aggregate : QueryMode.Row;
  state.distinct = !!query.distinct;
  state.filter = parseFilterRoot(query.filter, functions);

  const renames = new Map<string, string>();
  if (state.mode === QueryMode.Aggregate) {
    const { groupBy, aggregates } = parseAggregateSelect(query.select || [], functions, fields, renames);
    state.groupBy = groupBy;
    state.aggregates = aggregates;
  } else {
    state.select = parseRowSelect(query.select || [], functions, fields, renames);
  }
  const renamed = (name: string) => renames.get(name) ?? name;

  state.having = parseFilterRoot(query.having && renamedFieldRefs(query.having, renamed), functions);
  state.sort = (query.sort || []).map(
    (s): SortRow => ({ id: nextId(), field: renamed(s.field), dir: s.dir, nulls: s.nulls ?? SORT_NULLS_DEFAULT }),
  );
  state.page = parsePage(query.page);

  return state;
};

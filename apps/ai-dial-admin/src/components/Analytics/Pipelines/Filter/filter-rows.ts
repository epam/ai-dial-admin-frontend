import {
  PipelineFilterMatch,
  PipelineFilterOperator,
  PipelineFilterRow,
  PipelineFilterRows,
} from '@/src/components/Analytics/Pipelines/Filter/models';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryOperator,
  QueryPredicate,
  QueryValueExpr,
  QueryValueType,
} from '@/src/models/analytics/query';

// The DSL operators a row can stand for. Case-sensitive `co`/`nc` are left out, as the Query Builder leaves
// them out: a parsed `LIKE` keeps the filter in the SQL view.
const ROW_OPERATORS: Partial<Record<QueryOperator, PipelineFilterOperator>> = {
  [QueryOperator.Eq]: PipelineFilterOperator.Eq,
  [QueryOperator.Ne]: PipelineFilterOperator.Ne,
  [QueryOperator.Lt]: PipelineFilterOperator.Lt,
  [QueryOperator.Gt]: PipelineFilterOperator.Gt,
  [QueryOperator.Le]: PipelineFilterOperator.Le,
  [QueryOperator.Ge]: PipelineFilterOperator.Ge,
  [QueryOperator.Ico]: PipelineFilterOperator.Contains,
  [QueryOperator.Inc]: PipelineFilterOperator.NotContains,
  [QueryOperator.In]: PipelineFilterOperator.In,
};

// The service turns a `<>` it can fold into a value set into NOT over an equality, and a negated contains is
// its own operator already — so NOT over one of these reads back as its counterpart rather than refusing the
// filter. NOT over anything else (`in` above all, which has no counterpart here) is not flat.
const NEGATED_OPERATORS: Partial<Record<QueryOperator, QueryOperator>> = {
  [QueryOperator.Eq]: QueryOperator.Ne,
  [QueryOperator.Ne]: QueryOperator.Eq,
  [QueryOperator.Ico]: QueryOperator.Inc,
  [QueryOperator.Inc]: QueryOperator.Ico,
};

const isGroup = (node: QueryFilterNode): node is QueryGroup =>
  Object.values(QueryLogicalOperator).includes(node.op as QueryLogicalOperator);

const isValue = (expr?: QueryExpr): expr is QueryValueExpr => expr?.type === QueryExprType.Value;

const isNullValue = (expr?: QueryExpr): boolean => isValue(expr) && expr.value_type === QueryValueType.Null;

// The service returns a timestamp literal as epoch millis; the row shows it in the UTC text the renderer
// writes, with milliseconds only when there are any.
export const formatTimestampValue = (millis: string): string => {
  const iso = new Date(Number(millis)).toISOString().replace('T', ' ').replace('Z', '');
  return iso.endsWith('.000') ? iso.slice(0, -4) : iso;
};

const literalText = (expr: QueryValueExpr): string => {
  const value = expr.value ?? '';
  return expr.value_type === QueryValueType.Timestamp && /^-?\d+$/.test(value) ? formatTimestampValue(value) : value;
};

// The service nests a conjunction inside a conjunction when it folds two bounds on one column into a range,
// and the same for a disjunction; both read the same flattened, so the builder flattens them.
const flatten = (group: QueryGroup): QueryFilterNode[] =>
  group.args.flatMap((child) => (isGroup(child) && child.op === group.op ? flatten(child) : [child]));

const negate = (node: QueryFilterNode): QueryPredicate | null => {
  if (isGroup(node)) return null;
  const op = NEGATED_OPERATORS[node.op];
  return op ? { ...node, op } : null;
};

const toRow = (node: QueryFilterNode): PipelineFilterRow | null => {
  const predicate =
    isGroup(node) && node.op === QueryLogicalOperator.Not && node.args.length === 1 ? negate(node.args[0]) : node;
  if (!predicate || isGroup(predicate)) return null;

  const [left, right] = predicate.args;
  if (predicate.args.length !== 2 || left.type !== QueryExprType.Field) return null;
  const operator = ROW_OPERATORS[predicate.op];
  if (!operator) return null;

  const row = { id: crypto.randomUUID(), field: left.name };
  if (isNullValue(right)) {
    if (predicate.op === QueryOperator.Eq) return { ...row, operator: PipelineFilterOperator.IsEmpty, value: '' };
    if (predicate.op === QueryOperator.Ne) return { ...row, operator: PipelineFilterOperator.IsNotEmpty, value: '' };
    return null;
  }
  if (operator === PipelineFilterOperator.In) {
    if (right.type !== QueryExprType.Array || !right.items.every(isValue)) return null;
    const items = right.items.map(literalText);
    // A row keeps a list as comma-separated text, trimmed per item, so an item holding a comma or edge spaces
    // would come back as a different list on the next write.
    if (items.some((item) => item.includes(',') || item !== item.trim())) return null;
    return { ...row, operator, value: items.join(', ') };
  }
  return isValue(right) ? { ...row, operator, value: literalText(right) } : null;
};

// The rows a parsed filter reads as, or null when it is not a single condition or one AND / OR list of
// them — the shapes the builder can show without losing anything.
export const toFilterRows = (node?: QueryFilterNode): PipelineFilterRows | null => {
  if (!node) return { rows: [], match: PipelineFilterMatch.All };
  const isList = isGroup(node) && node.op !== QueryLogicalOperator.Not;
  const children = isList ? flatten(node) : [node];
  const rows = children.map(toRow);
  if (rows.some((row) => row === null)) return null;
  return {
    rows: rows as PipelineFilterRow[],
    match: isList && node.op === QueryLogicalOperator.Or ? PipelineFilterMatch.Any : PipelineFilterMatch.All,
  };
};

export const isFlatFilter = (node?: QueryFilterNode): boolean => toFilterRows(node) !== null;

import { functionByName, relativeTimeFunctions } from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { RELATIVE_TIME_NOW_FN, RELATIVE_TIME_SUBTRACT_FN } from '@/src/constants/analytics/query-builder';
import {
  findTimePeriodByRelative,
  timePeriodOptionsConfig,
  TimeFilterOption,
} from '@/src/constants/global-time-filter';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryTimeBound, RelativeTimeFunctions } from '@/src/models/analytics/query-builder';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryFnExpr,
  QueryGroup,
  QueryLogicalOperator,
  QueryOperator,
  QueryPredicate,
  QueryValueType,
} from '@/src/models/analytics/query';
import { QueryFunction, QueryFunctionArgKind } from '@/src/models/analytics/query-function';
import { TimeRange } from '@/src/models/time-range';

// The toolbar time filter targets the source's timestamp column: the first timestamp-typed field,
// falling back to the first date-typed one. Null means the query runs without a time bound.
export const findTimestampField = (fields: AnalyticsEntityField[]): string | null =>
  fields.find((f) => f.type === AnalyticsFieldType.Timestamp)?.name ??
  fields.find((f) => f.type === AnalyticsFieldType.Date)?.name ??
  null;

// The backend parses timestamp literals as longs (epoch millis) — ISO strings are rejected with
// "invalid long/timestamp literal".
const timePredicate = (field: string, op: QueryOperator, right: QueryExpr): QueryPredicate => ({
  op,
  args: [{ type: QueryExprType.Field, name: field }, right],
});

const instant = (date: Date): QueryExpr => ({
  type: QueryExprType.Value,
  value_type: QueryValueType.Timestamp,
  value: String(date.getTime()),
});

const nowExpr = (fns: RelativeTimeFunctions): QueryFnExpr => ({
  type: QueryExprType.Fn,
  name: fns.now.name,
  args: [],
});

// `amount` × `unit` back from the current instant.
const relativeExpr = (fns: RelativeTimeFunctions, unit: string, amount: number): QueryFnExpr => ({
  type: QueryExprType.Fn,
  name: fns.subtract.name,
  args: fns.subtract.args.map((arg): QueryExpr => {
    if (arg.kind === QueryFunctionArgKind.StringLiteral) {
      return { type: QueryExprType.Value, value_type: QueryValueType.String, value: unit };
    }
    if (arg.kind === QueryFunctionArgKind.IntegerLiteral) {
      return { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: String(amount) };
    }
    return nowExpr(fns);
  }),
});

// A preset period's bound, expressed relative to the current instant so the body carries the moving
// window rather than the two instants it was built at. Null when the toolbar holds a custom range,
// when the preset is anchored to a fixed start, or when the served catalog cannot express it.
const relativePredicates = (
  field: string,
  period: string,
  functions: QueryFunction[],
  options: TimeFilterOption[],
): QueryPredicate[] | null => {
  const preset = options.find((option) => option.value === period);
  if (!preset || !('unit' in preset)) return null;
  const fns = relativeTimeFunctions(functions, preset.unit, preset.amount);
  if (!fns) return null;
  return [
    timePredicate(field, QueryOperator.Ge, relativeExpr(fns, preset.unit, preset.amount)),
    timePredicate(field, QueryOperator.Le, nowExpr(fns)),
  ];
};

export const timeRangePredicates = (
  field: string,
  range: TimeRange,
  period?: string,
  functions: QueryFunction[] = [],
  options: TimeFilterOption[] = timePeriodOptionsConfig,
): QueryPredicate[] => {
  const relative = period ? relativePredicates(field, period, functions, options) : null;
  return (
    relative ?? [
      timePredicate(field, QueryOperator.Ge, instant(range.startDate)),
      timePredicate(field, QueryOperator.Le, instant(range.endDate)),
    ]
  );
};

// Appends the ge/le pair to the query filter: extends a root AND group, wraps anything else.
export const withTimeBound = (
  filter: QueryFilterNode | null,
  bound: QueryTimeBound,
  functions: QueryFunction[] = [],
): QueryFilterNode => {
  const predicates = timeRangePredicates(bound.field, bound.range, bound.period, functions);
  if (!filter) return { op: QueryLogicalOperator.And, args: predicates };
  const group = filter as QueryGroup;
  if (group.op === QueryLogicalOperator.And && Array.isArray(group.args)) {
    return { op: QueryLogicalOperator.And, args: [...group.args, ...predicates] };
  }
  return { op: QueryLogicalOperator.And, args: [filter, ...predicates] };
};

// Exactly one of the two: the preset a relative pair named, or the absolute range an instant pair
// carried. The preset is returned as an id rather than a resolved range so lifting stays a pure
// read of the query — the caller resolves it against the clock it already owns.
export interface LiftedTimeRange {
  periodId?: string;
  range?: TimeRange;
  rest?: QueryFilterNode;
}

enum TimeOperandKind {
  Instant = 'instant',
  Now = 'now',
  Relative = 'relative',
}

type TimeOperand =
  | { kind: TimeOperandKind.Instant; date: Date }
  | { kind: TimeOperandKind.Now }
  | { kind: TimeOperandKind.Relative; unit: string; amount: number };

// What a served call says, read through the catalog's own argument kinds. Null for anything that is
// not one of the two relative shapes the toolbar owns — including a served call of another name,
// which stays an ordinary condition rather than being read as a time bound.
const matchCall = (expr: QueryFnExpr, functions: QueryFunction[]): TimeOperand | null => {
  if (expr.name === RELATIVE_TIME_NOW_FN) return expr.args?.length ? null : { kind: TimeOperandKind.Now };
  if (expr.name !== RELATIVE_TIME_SUBTRACT_FN) return null;
  const subtract = functionByName(functions, expr.name);
  if (!subtract) return null;

  let unit: string | null = null;
  let amount: number | null = null;
  let isFromNow = false;
  subtract.args.forEach((argDef, i) => {
    const arg = expr.args?.[i];
    if (!arg) return;
    if (argDef.kind === QueryFunctionArgKind.StringLiteral && arg.type === QueryExprType.Value) {
      unit = arg.value;
    } else if (argDef.kind === QueryFunctionArgKind.IntegerLiteral && arg.type === QueryExprType.Value) {
      amount = Number(arg.value);
    } else if (argDef.kind === QueryFunctionArgKind.Expression && arg.type === QueryExprType.Fn) {
      isFromNow = matchCall(arg, functions)?.kind === TimeOperandKind.Now;
    }
  });

  if (!isFromNow || unit == null || amount == null || !Number.isFinite(amount)) return null;
  return { kind: TimeOperandKind.Relative, unit, amount };
};

const matchTimePredicate = (
  node: QueryFilterNode,
  field: string,
  op: QueryOperator,
  functions: QueryFunction[],
): TimeOperand | null => {
  const pred = node as QueryPredicate;
  if (pred.op !== op || !Array.isArray(pred.args)) return null;
  const [left, right] = pred.args;
  if (left?.type !== QueryExprType.Field || left.name !== field) return null;
  if (right?.type === QueryExprType.Fn) return matchCall(right, functions);
  if (right?.type !== QueryExprType.Value || typeof right.value !== 'string') return null;
  // Own serialization is epoch millis; hand-written JSON may use ISO strings — accept both.
  const date = /^\d+$/.test(right.value) ? new Date(Number(right.value)) : new Date(right.value);
  return isNaN(date.getTime()) ? null : { kind: TimeOperandKind.Instant, date };
};

const findBound = (
  args: QueryFilterNode[],
  field: string,
  op: QueryOperator,
  functions: QueryFunction[],
): { index: number; operand: TimeOperand } | null => {
  for (let index = 0; index < args.length; index += 1) {
    const operand = matchTimePredicate(args[index], field, op, functions);
    if (operand) return { index, operand };
  }
  return null;
};

// What the toolbar can own of a matched pair: two instants read as a custom range, and a bound
// relative to the current instant read as the preset of that span. A pair mixing the two, or a
// relative span no offered preset carries, is left in the filter tree — the toolbar shows a preset
// or a range and nothing else, and turning a moving window into a fixed one would freeze it
// silently.
const liftedPair = (
  lower: TimeOperand,
  upper: TimeOperand,
  functions: QueryFunction[],
  options: TimeFilterOption[],
): LiftedTimeRange | null => {
  if (lower.kind === TimeOperandKind.Instant && upper.kind === TimeOperandKind.Instant) {
    return { range: { startDate: lower.date, endDate: upper.date } };
  }
  if (lower.kind === TimeOperandKind.Relative && upper.kind === TimeOperandKind.Now) {
    const preset = findTimePeriodByRelative(lower.unit, lower.amount, options);
    // Only a bound this catalog could also serialize is handed to the toolbar. Lifting one it
    // cannot would show a preset that re-serializes as two instants — freezing, on the round trip,
    // the very window the author wrote as moving.
    if (!preset || !relativeTimeFunctions(functions, lower.unit, lower.amount)) return null;
    return { periodId: preset.value };
  }
  return null;
};

// Extracts a root-level ge + le predicate pair on the timestamp field so the toolbar control can
// own it. Time conditions in any other shape stay in the filter and render as ordinary conditions.
export const liftTimeRange = (
  filter: QueryFilterNode | undefined,
  field: string,
  functions: QueryFunction[] = [],
  options: TimeFilterOption[] = timePeriodOptionsConfig,
): LiftedTimeRange | null => {
  if (!filter) return null;
  const group = filter as QueryGroup;
  if (group.op !== QueryLogicalOperator.And || !Array.isArray(group.args)) return null;

  const lower = findBound(group.args, field, QueryOperator.Ge, functions);
  const upper = findBound(group.args, field, QueryOperator.Le, functions);
  if (!lower || !upper) return null;

  const lifted = liftedPair(lower.operand, upper.operand, functions, options);
  if (!lifted) return null;

  const rest = group.args.filter((_, index) => index !== lower.index && index !== upper.index);
  if (!rest.length) return lifted;
  if (rest.length === 1) return { ...lifted, rest: rest[0] };
  return { ...lifted, rest: { op: QueryLogicalOperator.And, args: rest } };
};

import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryTimeBound } from '@/src/models/analytics/query-builder';
import {
  QueryExprType,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryOperator,
  QueryPredicate,
  QueryValueType,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

// The toolbar time filter targets the source's timestamp column: the first timestamp-typed field,
// falling back to the first date-typed one. Null means the query runs without a time bound.
export const findTimestampField = (fields: AnalyticsEntityField[]): string | null =>
  fields.find((f) => f.type === AnalyticsFieldType.Timestamp)?.name ??
  fields.find((f) => f.type === AnalyticsFieldType.Date)?.name ??
  null;

// The backend parses timestamp literals as longs (epoch millis) — ISO strings are rejected with
// "invalid long/timestamp literal".
const timePredicate = (field: string, op: QueryOperator, date: Date): QueryPredicate => ({
  op,
  args: [
    { type: QueryExprType.Field, name: field },
    { type: QueryExprType.Value, value_type: QueryValueType.Timestamp, value: String(date.getTime()) },
  ],
});

export const timeRangePredicates = (field: string, range: TimeRange): QueryPredicate[] => [
  timePredicate(field, QueryOperator.Ge, range.startDate),
  timePredicate(field, QueryOperator.Le, range.endDate),
];

// Appends the ge/le pair to the query filter: extends a root AND group, wraps anything else.
export const withTimeBound = (filter: QueryFilterNode | null, bound: QueryTimeBound): QueryFilterNode => {
  const predicates = timeRangePredicates(bound.field, bound.range);
  if (!filter) return { op: QueryLogicalOperator.And, args: predicates };
  const group = filter as QueryGroup;
  if (group.op === QueryLogicalOperator.And && Array.isArray(group.args)) {
    return { op: QueryLogicalOperator.And, args: [...group.args, ...predicates] };
  }
  return { op: QueryLogicalOperator.And, args: [filter, ...predicates] };
};

interface LiftedTimeRange {
  range: TimeRange;
  rest?: QueryFilterNode;
}

const matchTimePredicate = (node: QueryFilterNode, field: string, op: QueryOperator): Date | null => {
  const pred = node as QueryPredicate;
  if (pred.op !== op || !Array.isArray(pred.args)) return null;
  const [left, right] = pred.args;
  if (left?.type !== QueryExprType.Field || left.name !== field) return null;
  if (right?.type !== QueryExprType.Value || typeof right.value !== 'string') return null;
  // Own serialization is epoch millis; hand-written JSON may use ISO strings — accept both.
  const date = /^\d+$/.test(right.value) ? new Date(Number(right.value)) : new Date(right.value);
  return isNaN(date.getTime()) ? null : date;
};

// Extracts a root-level ge + le predicate pair on the timestamp field so the toolbar control can
// own it. Time conditions in any other shape stay in the filter and render as ordinary conditions.
export const liftTimeRange = (filter: QueryFilterNode | undefined, field: string): LiftedTimeRange | null => {
  if (!filter) return null;
  const group = filter as QueryGroup;
  if (group.op !== QueryLogicalOperator.And || !Array.isArray(group.args)) return null;

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  const rest: QueryFilterNode[] = [];
  group.args.forEach((child) => {
    if (startDate === null) {
      const ge = matchTimePredicate(child, field, QueryOperator.Ge);
      if (ge) {
        startDate = ge;
        return;
      }
    }
    if (endDate === null) {
      const le = matchTimePredicate(child, field, QueryOperator.Le);
      if (le) {
        endDate = le;
        return;
      }
    }
    rest.push(child);
  });

  if (!startDate || !endDate) return null;
  const range: TimeRange = { startDate, endDate };
  if (!rest.length) return { range };
  if (rest.length === 1) return { range, rest: rest[0] };
  return { range, rest: { op: QueryLogicalOperator.And, args: rest } };
};

import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';
import { FnArgValue } from '@/src/models/analytics/query-builder';
import {
  QueryFunction,
  QueryFunctionArg,
  QueryFunctionArgKind,
  QueryFunctionGroup,
  QueryFunctionReturnType,
} from '@/src/models/analytics/query-function';

export const functionByName = (functions: QueryFunction[], name: string | null): QueryFunction | undefined =>
  name ? functions.find((f) => f.name === name) : undefined;

// Scalar functions populate the Group by section; aggregate and ordered-set-aggregate functions
// populate the Aggregate section.
export const scalarFunctions = (functions: QueryFunction[]): QueryFunction[] =>
  functions.filter((f) => f.group === QueryFunctionGroup.Scalar);

export const aggregateFunctions = (functions: QueryFunction[]): QueryFunction[] =>
  functions.filter(
    (f) => f.group === QueryFunctionGroup.Aggregate || f.group === QueryFunctionGroup.OrderedSetAggregate,
  );

// The implicit aggregate measure added when the user defines no explicit aggregate: the first
// aggregate-group function whose arguments are all optional — which is `count` by its metadata,
// chosen from the catalog rather than named in code. Undefined when the catalog has no such function.
export const implicitMeasureFunction = (functions: QueryFunction[]): QueryFunction | undefined =>
  functions.find((f) => f.group === QueryFunctionGroup.Aggregate && f.args.every((a) => a.optional));

// The literal value type a literal-kind argument serializes as. Expression arguments carry a field
// reference, not a value, so they are handled separately by the serializer.
export const valueTypeForArgKind = (kind: QueryFunctionArgKind): QueryValueType => {
  switch (kind) {
    case QueryFunctionArgKind.IntegerLiteral:
      return QueryValueType.Integer;
    case QueryFunctionArgKind.NumericLiteral:
      return QueryValueType.Decimal;
    default:
      return QueryValueType.String;
  }
};

// A fresh, empty arg-value slot per catalog argument, in order.
export const emptyArgs = (fn: QueryFunction): FnArgValue[] => fn.args.map(() => ({}));

// A human-readable summary of a function row's arguments (e.g. "5, minute, request_time"), used in
// the collapsed row chip. `displayName` resolves an expression arg's field to its display label; a
// placeholder marks an unfilled argument. Kept resolver-based so it needn't depend on fields.ts.
export const functionArgSummary = (
  fn: QueryFunction,
  args: FnArgValue[],
  displayName: (fieldName: string) => string,
): string =>
  fn.args
    .map((argDef, i) => {
      const value = args[i] ?? {};
      if (isExpressionArg(argDef)) return value.field ? displayName(value.field) : '…';
      return value.literal || '…';
    })
    .join(', ');

export const isExpressionArg = (arg: QueryFunctionArg): boolean => arg.kind === QueryFunctionArgKind.Expression;

// One argument slot is filled when its expression carries a field, or its literal is non-blank.
export const isArgFilled = (arg: QueryFunctionArg, value: FnArgValue | undefined): boolean =>
  isExpressionArg(arg) ? !!value?.field : !!(value?.literal && value.literal.trim() !== '');

// A function row is complete when every required (non-optional) argument is filled.
export const requiredArgsFilled = (fn: QueryFunction, args: FnArgValue[]): boolean =>
  fn.args.every((arg, i) => arg.optional || isArgFilled(arg, args[i]));

const RETURN_TYPE_MAP: Partial<Record<QueryFunctionReturnType, AnalyticsFieldType>> = {
  [QueryFunctionReturnType.String]: AnalyticsFieldType.String,
  [QueryFunctionReturnType.Integer]: AnalyticsFieldType.Integer,
  [QueryFunctionReturnType.Long]: AnalyticsFieldType.Long,
  [QueryFunctionReturnType.Numeric]: AnalyticsFieldType.Decimal,
  [QueryFunctionReturnType.Timestamp]: AnalyticsFieldType.Timestamp,
};

// The output type a function produces, for typing Having/Sort options. Fixed return types map
// directly; `same_as_argument` (min, max, percentile_disc) resolves to the schema type of the
// function's first expression argument's field.
export const functionResultType = (
  fn: QueryFunction,
  args: FnArgValue[],
  fields: AnalyticsEntityField[],
): AnalyticsFieldType => {
  if (fn.returns === QueryFunctionReturnType.SameAsArgument) {
    const exprIndex = fn.args.findIndex(isExpressionArg);
    const fieldName = exprIndex >= 0 ? args[exprIndex]?.field : undefined;
    return fields.find((f) => f.name === fieldName)?.type ?? AnalyticsFieldType.String;
  }
  return RETURN_TYPE_MAP[fn.returns] ?? AnalyticsFieldType.String;
};

import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';
import { FnArgValue, FunctionOption } from '@/src/models/analytics/query-builder';
import {
  QueryFunction,
  QueryFunctionArg,
  QueryFunctionArgKind,
  QueryFunctionGroup,
  QueryFunctionReturnType,
} from '@/src/models/analytics/query-function';

export const functionByName = (functions: QueryFunction[], name: string | null): QueryFunction | undefined =>
  name ? functions.find((f) => f.name === name) : undefined;

// A readable label for a catalog function name (`percentile_cont` → "Percentile cont"). Derived
// mechanically from the served name rather than from a per-function table, so a function the catalog
// adds later reads correctly with no frontend change — the catalog serves no display name of its own.
export const humanizeFunctionName = (name: string): string => {
  const spaced = name.replace(/_/g, ' ');
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : spaced;
};

// Where a catalog description stops naming the function and starts explaining it: a clause break, or
// the "<name> of/for <what it applies to>" and "<name> (<detail>)" patterns the catalog uses.
const LABEL_TAIL = /[;:.]|\s—\s|\s\(|\sof\s|\sfor\s/;
// Beyond this the leading phrase is prose, not a name ("Strips leading and trailing whitespace…").
const LABEL_MAX_WORDS = 3;

// What to call a function in a picker. Catalog descriptions open by naming the function ("Average of a
// numeric expression over the group; …", "Row count; with an argument …", "Continuous percentile: …"),
// so their leading phrase is the closest thing to a display name the catalog serves. A description
// that opens with prose instead ("Lowercases a text expression."), or none at all, falls back to the
// humanized function name. Still no per-function table: a function the catalog adds names itself.
export const functionLabel = (fn: QueryFunction): string => {
  const lead = (fn.description || '').split(LABEL_TAIL)[0].trim();
  const words = lead.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > LABEL_MAX_WORDS) return humanizeFunctionName(fn.name);
  return lead.charAt(0).toUpperCase() + lead.slice(1);
};

// Labels for a whole picker. Two functions can open their descriptions with the same phrase ("Sum of
// a numeric expression…" and a future "Sum of squares of…"), and two identically labelled options are
// unpickable — so on a collision every function involved falls back to its own catalog name.
export const functionLabels = (functions: QueryFunction[]): Map<string, string> => {
  const lifted = functions.map((fn) => ({ name: fn.name, label: functionLabel(fn) }));
  const collides = new Set(
    lifted.filter((a, i) => lifted.some((b, j) => i !== j && b.label === a.label)).map((a) => a.label),
  );
  return new Map(lifted.map(({ name, label }) => [name, collides.has(label) ? humanizeFunctionName(name) : label]));
};

// Scalar functions populate the Group by section; aggregate and ordered-set-aggregate functions
// populate the Aggregate section.
export const scalarFunctions = (functions: QueryFunction[]): QueryFunction[] =>
  functions.filter((f) => f.group === QueryFunctionGroup.Scalar);

export const aggregateFunctions = (functions: QueryFunction[]): QueryFunction[] =>
  functions.filter(
    (f) => f.group === QueryFunctionGroup.Aggregate || f.group === QueryFunctionGroup.OrderedSetAggregate,
  );

const toFunctionOptions = (functions: QueryFunction[]): FunctionOption[] => {
  const labels = functionLabels(functions);
  return functions.map((fn) => ({ name: fn.name, label: labels.get(fn.name) ?? fn.name, hint: fn.description }));
};

// A picker's Functions group where a function stands in for a projected column: every scalar the
// catalog serves, named and hinted from the served data alone.
export const scalarFunctionOptions = (functions: QueryFunction[]): FunctionOption[] =>
  toFunctionOptions(scalarFunctions(functions));

// The same group where a function stands in for a compared column, minus the ones returning an array.
// The service accepts an array result as a projected column but rejects it as an operand — and it
// rejects the whole query for one bad predicate, so offering one here would take every other
// condition down with it. Keyed on the served return type, never on a list of names.
export const operandFunctionOptions = (functions: QueryFunction[]): FunctionOption[] =>
  toFunctionOptions(scalarFunctions(functions).filter((fn) => fn.returns !== QueryFunctionReturnType.Array));

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
  [QueryFunctionReturnType.Boolean]: AnalyticsFieldType.Boolean,
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

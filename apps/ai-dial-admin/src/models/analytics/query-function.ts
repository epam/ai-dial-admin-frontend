// Discovery view of the backend's closed function catalog, served by GET /v1/queries/functions.
// Mirrors the service DTO (web.dto.query.QueryFunction*). The frontend holds no function knowledge
// of its own — every function name, group, argument shape, allowed value, bound, distinct support,
// return type, and description is read from this served catalog.

export enum QueryFunctionGroup {
  Scalar = 'scalar',
  Aggregate = 'aggregate',
  OrderedSetAggregate = 'ordered_set_aggregate',
}

export enum QueryFunctionArgKind {
  Expression = 'expression',
  IntegerLiteral = 'integer_literal',
  NumericLiteral = 'numeric_literal',
  StringLiteral = 'string_literal',
}

export enum QueryFunctionReturnType {
  String = 'string',
  Integer = 'integer',
  Long = 'long',
  Numeric = 'numeric',
  Timestamp = 'timestamp',
  SameAsArgument = 'same_as_argument',
}

// Constraints on a literal argument's value. Only the applicable members are present — the backend
// omits inapplicable ones rather than serializing null.
export interface QueryFunctionArgConstraints {
  allowed_values?: string[];
  min?: number;
  max?: number;
}

export interface QueryFunctionArg {
  name: string;
  kind: QueryFunctionArgKind;
  // Present (true) only when the argument may be omitted (e.g. count's single argument).
  optional?: boolean;
  constraints?: QueryFunctionArgConstraints;
}

export interface QueryFunction {
  name: string;
  group: QueryFunctionGroup;
  signature: string;
  returns: QueryFunctionReturnType;
  distinct_supported: boolean;
  description: string;
  args: QueryFunctionArg[];
}

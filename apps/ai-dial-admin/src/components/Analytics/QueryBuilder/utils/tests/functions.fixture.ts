import {
  QueryFunction,
  QueryFunctionArgKind,
  QueryFunctionGroup,
  QueryFunctionReturnType,
} from '@/src/models/analytics/query-function';

// A representative slice of the served function catalog, mirroring the backend's shape, for use in
// query-builder unit tests. Covers each argument kind (expression, integer/numeric/string literal),
// constraints (bounds, allowed values), distinct support, and each return type — including the
// functions the frontend never hardcoded (width_bucket, percentile_cont, percentile_disc).
export const TEST_FUNCTIONS: QueryFunction[] = [
  {
    name: 'abs',
    group: QueryFunctionGroup.Scalar,
    signature: 'abs(value)',
    returns: QueryFunctionReturnType.Numeric,
    distinct_supported: false,
    description: 'absolute value',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'avg',
    group: QueryFunctionGroup.Aggregate,
    signature: 'avg(value)',
    returns: QueryFunctionReturnType.Numeric,
    distinct_supported: true,
    description: 'average',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'count',
    group: QueryFunctionGroup.Aggregate,
    signature: 'count([value])',
    returns: QueryFunctionReturnType.Long,
    distinct_supported: true,
    description: 'row count',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression, optional: true }],
  },
  {
    name: 'date_bin',
    group: QueryFunctionGroup.Scalar,
    signature: 'date_bin(amount, unit, timestamp)',
    returns: QueryFunctionReturnType.Timestamp,
    distinct_supported: false,
    description: 'time bucket',
    args: [
      { name: 'amount', kind: QueryFunctionArgKind.IntegerLiteral, constraints: { min: 1 } },
      {
        name: 'unit',
        kind: QueryFunctionArgKind.StringLiteral,
        constraints: { allowed_values: ['day', 'hour', 'minute', 'second', 'week'] },
      },
      { name: 'timestamp', kind: QueryFunctionArgKind.Expression },
    ],
  },
  {
    name: 'length',
    group: QueryFunctionGroup.Scalar,
    signature: 'length(text)',
    returns: QueryFunctionReturnType.Integer,
    distinct_supported: false,
    description: 'string length',
    args: [{ name: 'text', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'lower',
    group: QueryFunctionGroup.Scalar,
    signature: 'lower(text)',
    returns: QueryFunctionReturnType.String,
    distinct_supported: false,
    description: 'lowercase',
    args: [{ name: 'text', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'max',
    group: QueryFunctionGroup.Aggregate,
    signature: 'max(value)',
    returns: QueryFunctionReturnType.SameAsArgument,
    distinct_supported: false,
    description: 'maximum',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'min',
    group: QueryFunctionGroup.Aggregate,
    signature: 'min(value)',
    returns: QueryFunctionReturnType.SameAsArgument,
    distinct_supported: false,
    description: 'minimum',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'percentile_cont',
    group: QueryFunctionGroup.OrderedSetAggregate,
    signature: 'percentile_cont(fraction, column)',
    returns: QueryFunctionReturnType.Numeric,
    distinct_supported: false,
    description: 'continuous percentile',
    args: [
      { name: 'fraction', kind: QueryFunctionArgKind.NumericLiteral, constraints: { min: 0, max: 1 } },
      { name: 'column', kind: QueryFunctionArgKind.Expression },
    ],
  },
  {
    name: 'percentile_disc',
    group: QueryFunctionGroup.OrderedSetAggregate,
    signature: 'percentile_disc(fraction, column)',
    returns: QueryFunctionReturnType.SameAsArgument,
    distinct_supported: false,
    description: 'discrete percentile',
    args: [
      { name: 'fraction', kind: QueryFunctionArgKind.NumericLiteral, constraints: { min: 0, max: 1 } },
      { name: 'column', kind: QueryFunctionArgKind.Expression },
    ],
  },
  {
    name: 'sum',
    group: QueryFunctionGroup.Aggregate,
    signature: 'sum(value)',
    returns: QueryFunctionReturnType.Numeric,
    distinct_supported: true,
    description: 'sum',
    args: [{ name: 'value', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'trim',
    group: QueryFunctionGroup.Scalar,
    signature: 'trim(text)',
    returns: QueryFunctionReturnType.String,
    distinct_supported: false,
    description: 'trim whitespace',
    args: [{ name: 'text', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'upper',
    group: QueryFunctionGroup.Scalar,
    signature: 'upper(text)',
    returns: QueryFunctionReturnType.String,
    distinct_supported: false,
    description: 'uppercase',
    args: [{ name: 'text', kind: QueryFunctionArgKind.Expression }],
  },
  {
    name: 'width_bucket',
    group: QueryFunctionGroup.Scalar,
    signature: 'width_bucket(operand, low, high, count)',
    returns: QueryFunctionReturnType.Integer,
    distinct_supported: false,
    description: 'histogram bucket',
    args: [
      { name: 'operand', kind: QueryFunctionArgKind.Expression },
      { name: 'low', kind: QueryFunctionArgKind.Expression },
      { name: 'high', kind: QueryFunctionArgKind.Expression },
      { name: 'count', kind: QueryFunctionArgKind.Expression },
    ],
  },
];

export const fnFixture = (name: string): QueryFunction => {
  const fn = TEST_FUNCTIONS.find((f) => f.name === name);
  if (!fn) throw new Error(`Test fixture missing function: ${name}`);
  return fn;
};

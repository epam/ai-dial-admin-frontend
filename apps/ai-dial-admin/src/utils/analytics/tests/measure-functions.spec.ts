import { describe, expect, test } from 'vitest';

import {
  QueryFunction,
  QueryFunctionArgKind,
  QueryFunctionGroup,
  QueryFunctionReturnType,
} from '@/src/models/analytics/query-function';
import {
  findMeasureFunction,
  isColumnlessFunction,
  requiredArity,
  toMeasureFunctions,
} from '@/src/utils/analytics/measure-functions';

const fn = (over: Partial<QueryFunction>): QueryFunction => ({
  name: 'sum',
  group: QueryFunctionGroup.Aggregate,
  signature: 'sum(expr)',
  returns: QueryFunctionReturnType.Numeric,
  distinct_supported: true,
  description: '',
  args: [{ name: 'expr', kind: QueryFunctionArgKind.Expression }],
  ...over,
});

const count = fn({
  name: 'count',
  distinct_supported: true,
  args: [{ name: 'expr', kind: QueryFunctionArgKind.Expression, optional: true }],
});

const argMax = fn({
  name: 'arg_max',
  distinct_supported: false,
  args: [
    { name: 'value', kind: QueryFunctionArgKind.Expression },
    { name: 'order', kind: QueryFunctionArgKind.Expression },
  ],
});

const scalar = fn({ name: 'lower', group: QueryFunctionGroup.Scalar });

describe('Utils :: analytics :: measure functions', () => {
  test('counts only the arguments a function insists on', () => {
    expect(requiredArity(fn({}))).toBe(1);
    expect(requiredArity(count)).toBe(0);
    expect(requiredArity(argMax)).toBe(2);
  });

  test('offers the catalog aggregates a single column can satisfy', () => {
    const offered = toMeasureFunctions([fn({}), count, argMax, scalar]).map((candidate) => candidate.name);

    expect(offered).toEqual(['sum', 'count']);
  });

  test('excludes a two-operand aggregate without naming it', () => {
    const added = fn({ name: 'any_future_pair', args: argMax.args });

    expect(toMeasureFunctions([added])).toEqual([]);
  });

  test('offers a column for a function whose argument is merely optional', () => {
    expect(isColumnlessFunction(count)).toBe(false);
    expect(isColumnlessFunction(fn({}))).toBe(false);
    expect(isColumnlessFunction(undefined)).toBe(false);
  });

  test('withholds the column only for a function that declares no argument', () => {
    expect(isColumnlessFunction(fn({ name: 'nullary', args: [] }))).toBe(true);
  });

  test('resolves a measure function by name and reports an unknown one as absent', () => {
    const catalog = [fn({}), count];

    expect(findMeasureFunction(catalog, 'count')).toBe(count);
    expect(findMeasureFunction(catalog, 'retired_fn')).toBeUndefined();
    expect(findMeasureFunction(catalog, undefined)).toBeUndefined();
  });
});

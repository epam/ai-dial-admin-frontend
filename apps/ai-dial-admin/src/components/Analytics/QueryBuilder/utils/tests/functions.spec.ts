import { describe, expect, test } from 'vitest';

import {
  functionLabel,
  functionLabels,
  humanizeFunctionName,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { fnFixture } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { QueryFunction, QueryFunctionGroup, QueryFunctionReturnType } from '@/src/models/analytics/query-function';

const withDescription = (description: string): QueryFunction => ({
  name: 'percentile_cont',
  group: QueryFunctionGroup.OrderedSetAggregate,
  signature: 'percentile_cont(fraction, column)',
  returns: QueryFunctionReturnType.Numeric,
  distinct_supported: false,
  description,
  args: [],
});

describe('humanizeFunctionName', () => {
  test('capitalizes and unslugs a catalog name', () => {
    expect(humanizeFunctionName('sum')).toBe('Sum');
    expect(humanizeFunctionName('percentile_cont')).toBe('Percentile cont');
  });

  test('an empty name stays empty', () => {
    expect(humanizeFunctionName('')).toBe('');
  });
});

describe('functionLabel', () => {
  test('names a function by its description', () => {
    expect(functionLabel(fnFixture('avg'))).toBe('Average');
    expect(functionLabel(fnFixture('count'))).toBe('Row count');
    expect(functionLabel(fnFixture('date_bin'))).toBe('Time bucket');
  });

  test('cuts the leading phrase at the first sentence or clause break', () => {
    expect(functionLabel(withDescription('Row count; with an argument counts non-null values.'))).toBe('Row count');
    expect(functionLabel(withDescription('Continuous percentile. Interpolates between values.'))).toBe(
      'Continuous percentile',
    );
    expect(functionLabel(withDescription('Bucket — assigns a value to a histogram bucket'))).toBe('Bucket');
  });

  // A description that opens with prose is not a name, so the humanized catalog name reads better.
  test('falls back to the humanized name for a prose or absent description', () => {
    expect(functionLabel(withDescription('Returns the value below which a given percentage falls'))).toBe(
      'Percentile cont',
    );
    expect(functionLabel(withDescription(''))).toBe('Percentile cont');
  });
});

// The production catalog's own descriptions (QueryFunctionCatalog.java), so the heuristic is proven
// against the text it actually receives rather than only against short fixtures.
describe('functionLabel over the served catalog text', () => {
  const CASES: Array<[string, string, string]> = [
    ['abs', 'Absolute value of a numeric expression.', 'Absolute value'],
    ['avg', 'Average of a numeric expression over the group; distinct deduplicates values first.', 'Average'],
    ['count', 'Row count; with an argument counts non-null values, with distinct counts unique values.', 'Row count'],
    ['length', 'Character length of a text expression.', 'Character length'],
    ['max', 'Maximum value of an expression over the group.', 'Maximum value'],
    ['min', 'Minimum value of an expression over the group.', 'Minimum value'],
    [
      'percentile_cont',
      'Continuous percentile: interpolates between adjacent values at the given fraction of the ordered group.',
      'Continuous percentile',
    ],
    [
      'percentile_disc',
      'Discrete percentile: returns an actual member of the ordered group at the given fraction.',
      'Discrete percentile',
    ],
    ['sum', 'Sum of a numeric expression over the group; distinct deduplicates values first.', 'Sum'],
    [
      'width_bucket',
      'Histogram bucket (1..count) the operand falls into across count equal-width buckets spanning [low, high).',
      'Histogram bucket',
    ],
    // Prose-first descriptions carry no name to lift, so these fall back to the catalog name.
    ['lower', 'Lowercases a text expression.', 'Lower'],
    ['trim', 'Strips leading and trailing whitespace from a text expression.', 'Trim'],
    ['date_bin', 'Truncates timestamp down to the start of the fixed-width interval amount × unit.', 'Date bin'],
  ];

  test.each(CASES)('%s → %s', (name, description, expected) => {
    expect(functionLabel({ ...withDescription(description), name })).toBe(expected);
  });
});

describe('functionLabels', () => {
  const fn = (name: string, description: string): QueryFunction => ({ ...withDescription(description), name });

  test('names every function in the set from its description', () => {
    const labels = functionLabels([fn('avg', 'Average of a numeric expression.'), fn('count', 'Row count; …')]);
    expect([...labels.entries()]).toEqual([
      ['avg', 'Average'],
      ['count', 'Row count'],
    ]);
  });

  // Two options reading the same are unpickable, so a collision drops both back to their own names.
  test('a colliding leading phrase falls back to the catalog names', () => {
    const labels = functionLabels([
      fn('sum', 'Sum of a numeric expression over the group.'),
      fn('sum_squares', 'Sum of squares of a numeric expression.'),
      fn('avg', 'Average of a numeric expression.'),
    ]);
    expect(labels.get('sum')).toBe('Sum');
    expect(labels.get('sum_squares')).toBe('Sum squares');
    expect(labels.get('avg')).toBe('Average');
  });
});

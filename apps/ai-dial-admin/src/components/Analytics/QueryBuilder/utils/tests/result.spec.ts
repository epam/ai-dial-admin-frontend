import { describe, expect, test } from 'vitest';

import { getResultColumns, getResultTotal, renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { StructuredQueryResult } from '@/src/models/analytics/query';

describe('renderCell', () => {
  test('blank for null/undefined', () => {
    expect(renderCell(null)).toBe('');
    expect(renderCell(undefined)).toBe('');
  });

  test('stringifies objects/arrays, coerces primitives', () => {
    expect(renderCell({ a: 1 })).toBe('{"a":1}');
    expect(renderCell([1, 2])).toBe('[1,2]');
    expect(renderCell(42)).toBe('42');
    expect(renderCell(true)).toBe('true');
  });
});

describe('getResultColumns', () => {
  test('null result → no columns', () => {
    expect(getResultColumns(null)).toEqual([]);
  });

  test('prefers declared columns', () => {
    const result: StructuredQueryResult = { columns: ['a', 'b'], rows: [{ a: 1 }] };
    expect(getResultColumns(result).map((c) => c.field)).toEqual(['a', 'b']);
  });

  test('falls back to union of row keys when no columns declared', () => {
    const result: StructuredQueryResult = { columns: [], rows: [{ a: 1 }, { b: 2, c: 3 }] };
    expect(getResultColumns(result).map((c) => c.field)).toEqual(['a', 'b', 'c']);
  });
});

describe('getResultTotal', () => {
  test('undefined for null result', () => {
    expect(getResultTotal(null)).toBeUndefined();
  });

  test('reads the totalCount from a row-mode include_total response', () => {
    expect(getResultTotal({ rows: [], totalCount: 42 })).toBe(42);
  });

  test('undefined when no total is present (aggregate/SQL runs)', () => {
    expect(getResultTotal({ rows: [] })).toBeUndefined();
  });
});

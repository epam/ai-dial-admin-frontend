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

  test('heads a column by its label when the map has one, otherwise by the raw column name', () => {
    const result: StructuredQueryResult = { columns: ['total_tokens', 'Total tokens (sum)'], rows: [] };
    const columns = getResultColumns(result, { total_tokens: 'Total tokens' });
    expect(columns.map((c) => c.headerName)).toEqual(['Total tokens', 'Total tokens (sum)']);
    expect(columns.map((c) => c.field)).toEqual(['total_tokens', 'Total tokens (sum)']);
  });

  test('without a label map every header is the raw column name', () => {
    const result: StructuredQueryResult = { columns: ['total_tokens'], rows: [] };
    expect(getResultColumns(result)[0].headerName).toBe('total_tokens');
  });

  // ag-grid's default `field`-based lookup treats a dot as a nested-property path (`data.test.test`),
  // but an enrichment's "table.column" projection is a single flat key on the row — the column's
  // valueGetter must read it literally or the cell renders blank despite the row actually having data.
  test('a dotted column name (e.g. an enrichment projection) resolves the flat key, not a nested path', () => {
    const result: StructuredQueryResult = {
      columns: ['event_id', 'test.test'],
      rows: [{ event_id: '1', 'test.test': 'test_value' }],
    };
    const dottedCol = getResultColumns(result).find((c) => c.field === 'test.test');

    const value = dottedCol?.valueGetter?.({
      data: { event_id: '1', 'test.test': 'test_value' },
    } as Parameters<NonNullable<typeof dottedCol.valueGetter>>[0]);

    expect(value).toBe('test_value');
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

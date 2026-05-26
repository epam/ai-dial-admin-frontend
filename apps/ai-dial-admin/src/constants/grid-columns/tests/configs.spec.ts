import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { numericColumn, priceColumn } from '../configs';

const callFilterValueGetter = (
  col: Partial<ColDef>,
  data: Record<string, unknown> | null | undefined,
  field: string,
) => {
  const params = { data, colDef: { field } } as unknown as ValueGetterParams;
  return (col.filterValueGetter as (p: ValueGetterParams) => unknown)(params);
};

describe('numericColumn.filterValueGetter', () => {
  test('coerces numeric string cell values to numbers so agNumberColumnFilter equals matches', () => {
    expect(callFilterValueGetter(numericColumn, { completion_tokens: '201' }, 'completion_tokens')).toBe(201);
  });

  test('returns 0 for the string "0" (not null)', () => {
    expect(callFilterValueGetter(numericColumn, { prompt_tokens: '0' }, 'prompt_tokens')).toBe(0);
  });

  test('passes numbers through unchanged', () => {
    expect(callFilterValueGetter(numericColumn, { tokens: 42 }, 'tokens')).toBe(42);
  });

  test('returns null for missing, empty, or non-numeric cell values', () => {
    expect(callFilterValueGetter(numericColumn, {}, 'tokens')).toBeNull();
    expect(callFilterValueGetter(numericColumn, { tokens: '' }, 'tokens')).toBeNull();
    expect(callFilterValueGetter(numericColumn, { tokens: null }, 'tokens')).toBeNull();
    expect(callFilterValueGetter(numericColumn, { tokens: 'abc' }, 'tokens')).toBeNull();
  });

  test('returns null when params.data is undefined (initial render before rows arrive)', () => {
    expect(callFilterValueGetter(numericColumn, undefined, 'tokens')).toBeNull();
  });
});

describe('priceColumn.filterValueGetter (inherited from numericColumn)', () => {
  const col = priceColumn('Price');

  test('coerces a price string into a number for filter equality', () => {
    expect(callFilterValueGetter(col, { price: '0.00000228123' }, 'price')).toBe(0.00000228123);
  });

  test('keeps the numericColumn behavior for missing and empty values', () => {
    expect(callFilterValueGetter(col, {}, 'price')).toBeNull();
    expect(callFilterValueGetter(col, { price: '' }, 'price')).toBeNull();
  });
});

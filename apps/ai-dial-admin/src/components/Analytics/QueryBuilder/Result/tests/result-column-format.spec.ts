import { ColDef, IRowNode, ITooltipParams, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { getValueClassColumn } from '@/src/components/Analytics/QueryBuilder/Result/result-column-format';
import { ResultValueClass } from '@/src/models/analytics/query-builder';

const format = (col: Partial<ColDef>, value: unknown): string =>
  (col.valueFormatter as (p: ValueFormatterParams) => string)({ value } as ValueFormatterParams);

const tooltip = (col: Partial<ColDef>, value: unknown): unknown =>
  (col.tooltipValueGetter as (p: ITooltipParams) => unknown)({ value } as ITooltipParams);

const filterValue = (col: Partial<ColDef>, data: Record<string, unknown>, field: string): unknown =>
  (col.filterValueGetter as (p: ValueGetterParams) => unknown)({
    data,
    colDef: { field },
  } as unknown as ValueGetterParams);

const compare = (col: Partial<ColDef>, a: unknown, b: unknown): number =>
  (col.comparator as (a: unknown, b: unknown, nodeA: IRowNode, nodeB: IRowNode, isInverted: boolean) => number)(
    a,
    b,
    {} as IRowNode,
    {} as IRowNode,
    false,
  );

describe('getValueClassColumn — Compact', () => {
  const col = getValueClassColumn(ResultValueClass.Compact);

  test('renders a value below one thousand without a unit and without a decimal', () => {
    expect(format(col, 999)).toBe('999');
  });

  test('compacts one thousand to a thousands unit', () => {
    expect(format(col, 1000)).toBe('1 K');
  });

  test('compacts a numeric string the way a backend sends a Long', () => {
    expect(format(col, '1500000')).toBe('1.5 M');
  });

  test('falls back to the plain rendering when the value will not parse as a number', () => {
    expect(format(col, 'n/a')).toBe('n/a');
    expect(format(col, true)).toBe('true');
    expect(format(col, null)).toBe('');
  });

  test('puts the exact thousand-delimited value in the tooltip, not the compacted text', () => {
    expect(tooltip(col, 1234567)).toBe('1,234,567');
    expect(tooltip(col, '1500000')).toBe('1,500,000');
  });

  test('sorts by numeric value, so "9" comes before "10"', () => {
    expect(compare(col, '9', '10')).toBeLessThan(0);
  });

  test('treats a zero as a value rather than as an absent one', () => {
    expect(compare(col, '0', '10')).toBeLessThan(0);
  });

  test('resolves a dotted column name as a literal key for the filter', () => {
    expect(filterValue(col, { 'usage.tokens': '201' }, 'usage.tokens')).toBe(201);
  });

  test('carries no valueGetter, so the result column keeps its own', () => {
    expect('valueGetter' in col).toBe(false);
  });

  test('filters through the number filter the compacted cell text could not serve', () => {
    expect(col.filter).toBe('agNumberColumnFilter');
  });
});

describe('getValueClassColumn — Significant', () => {
  const col = getValueClassColumn(ResultValueClass.Significant);

  test('keeps two significant digits of a sub-unit decimal instead of rounding it to zero', () => {
    expect(format(col, '0.00000228123')).toBe('0.0000023');
  });

  test('renders an exact zero as zero', () => {
    expect(format(col, 0)).toBe('0');
  });

  test('compacts a value at or above one unit', () => {
    expect(format(col, '19.74')).toBe('19.7');
  });

  test('puts a fractional value in the tooltip verbatim, without rounding it to two decimals', () => {
    expect(tooltip(col, '0.00000228123')).toBe('0.00000228123');
  });

  test('puts a whole value in the tooltip thousand-delimited', () => {
    expect(tooltip(col, 2000)).toBe('2,000');
  });

  test('falls back to the plain rendering when the value will not parse as a number', () => {
    expect(format(col, '')).toBe('');
    expect(format(col, 'NaN')).toBe('NaN');
  });
});

describe('getValueClassColumn — Duration', () => {
  const col = getValueClassColumn(ResultValueClass.Duration);

  test('carries no valueFormatter, so the cell stays in the unit its header declares', () => {
    expect(col.valueFormatter).toBeUndefined();
  });

  test('carries no tooltipValueGetter', () => {
    expect(col.tooltipValueGetter).toBeUndefined();
  });

  test('carries no comparator', () => {
    expect(col.comparator).toBeUndefined();
  });

  test('carries no filter', () => {
    expect(col.filter).toBeUndefined();
  });

  test('carries no cellClass', () => {
    expect(col.cellClass).toBeUndefined();
  });

  test('is the same empty fragment an unclassified column gets', () => {
    expect(col).toEqual(getValueClassColumn(undefined));
  });
});

describe('getValueClassColumn — DateTime', () => {
  const col = getValueClassColumn(ResultValueClass.DateTime);
  const millis = 1784186472371;

  test('renders millisecond epochs as a local date-time', () => {
    expect(format(col, millis)).toBe(new Date(millis).toLocaleString());
    expect(format(col, String(millis))).toBe(new Date(millis).toLocaleString());
  });

  test('puts the same local date-time in the tooltip', () => {
    expect(tooltip(col, millis)).toBe(new Date(millis).toLocaleString());
  });

  test('gives the filter a Date, so agDateColumnFilter can compare it', () => {
    const filtered = filterValue(col, { started_at: millis }, 'started_at');

    expect(filtered).toBeInstanceOf(Date);
    expect((filtered as Date).getTime()).toBe(millis);
  });

  test('pairs the date filter with a suppressed floating filter, which is what keeps the grid from throwing', () => {
    expect(col.filter).toBe('agDateColumnFilter');
    expect(col.floatingFilter).toBe(false);
  });

  test('carries no valueGetter, so the result column keeps its own', () => {
    expect('valueGetter' in col).toBe(false);
  });
});

describe('getValueClassColumn — unclassified', () => {
  test('returns an empty fragment for an unclassified column', () => {
    expect(getValueClassColumn(undefined)).toEqual({});
  });
});

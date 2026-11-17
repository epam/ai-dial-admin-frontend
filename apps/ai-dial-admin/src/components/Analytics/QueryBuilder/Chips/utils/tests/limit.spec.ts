import { describe, expect, test } from 'vitest';

import { LimitChipForm } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { isLimitFormValid, toLimitForm, withLimit } from '@/src/components/Analytics/QueryBuilder/Chips/utils/limit';
import { QueryPageType } from '@/src/models/analytics/query';
import { PageState } from '@/src/models/analytics/query-builder';

const PAGE: PageState = {
  enabled: false,
  type: QueryPageType.Cursor,
  offset: 40,
  limit: 20,
  includeTotal: true,
  cursor: 'abc',
  cursorLimit: 100,
};

const formOf = (rows: string, offset = '0'): LimitChipForm => ({ rows, offset });

describe('toLimitForm', () => {
  test('reads the limit and offset of a page as text', () => {
    expect(toLimitForm(PAGE)).toEqual({ rows: '20', offset: '40' });
  });

  test('reads a zero offset as text', () => {
    expect(toLimitForm({ ...PAGE, offset: 0 })).toEqual({ rows: '20', offset: '0' });
  });
});

describe('isLimitFormValid', () => {
  test('accepts a positive row count with a whole offset', () => {
    expect(isLimitFormValid(formOf('10', '0'))).toBe(true);
    expect(isLimitFormValid(formOf('1', '250'))).toBe(true);
  });

  test('accepts values padded with whitespace', () => {
    expect(isLimitFormValid(formOf(' 10 ', ' 5 '))).toBe(true);
  });

  test('rejects a row count below one', () => {
    expect(isLimitFormValid(formOf('0'))).toBe(false);
  });

  test('rejects a row count that is not a whole number', () => {
    expect(isLimitFormValid(formOf(''))).toBe(false);
    expect(isLimitFormValid(formOf('   '))).toBe(false);
    expect(isLimitFormValid(formOf('-1'))).toBe(false);
    expect(isLimitFormValid(formOf('1.5'))).toBe(false);
    expect(isLimitFormValid(formOf('1e3'))).toBe(false);
    expect(isLimitFormValid(formOf('abc'))).toBe(false);
  });

  test('rejects an offset that is not a whole number', () => {
    expect(isLimitFormValid(formOf('10', ''))).toBe(false);
    expect(isLimitFormValid(formOf('10', '-1'))).toBe(false);
    expect(isLimitFormValid(formOf('10', '2.5'))).toBe(false);
    expect(isLimitFormValid(formOf('10', 'abc'))).toBe(false);
  });
});

describe('withLimit', () => {
  test('applies the form as an enabled offset page without a total and keeps the cursor settings', () => {
    expect(withLimit(PAGE, formOf('50', '100'))).toEqual({
      enabled: true,
      type: QueryPageType.Offset,
      offset: 100,
      limit: 50,
      includeTotal: false,
      cursor: 'abc',
      cursorLimit: 100,
    });
  });

  test('parses values padded with whitespace', () => {
    const next = withLimit(PAGE, formOf(' 7 ', ' 3 '));

    expect(next.limit).toBe(7);
    expect(next.offset).toBe(3);
  });

  test('keeps the current limit and offset when the form values are not whole numbers', () => {
    const next = withLimit(PAGE, formOf('abc', ''));

    expect(next.limit).toBe(20);
    expect(next.offset).toBe(40);
  });

  test('does not mutate the given page', () => {
    const page = { ...PAGE };

    withLimit(page, formOf('50', '100'));

    expect(page).toEqual(PAGE);
  });
});

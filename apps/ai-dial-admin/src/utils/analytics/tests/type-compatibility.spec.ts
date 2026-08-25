import { describe, expect, test } from 'vitest';

import { isTypeMismatch } from '@/src/utils/analytics/type-compatibility';

describe('Utils :: analytics :: isTypeMismatch', () => {
  test('treats decimal and double as compatible', () => {
    expect(isTypeMismatch('decimal', 'double')).toBe(false);
  });

  test.each([
    ['long', 'integer'],
    ['string', 'uuid'],
    ['timestamp', 'date'],
    ['boolean', 'bool'],
  ])('treats %s and %s as compatible', (columnType, varType) => {
    expect(isTypeMismatch(columnType, varType)).toBe(false);
  });

  test.each([
    ['string', 'long'],
    ['timestamp', 'string'],
    ['boolean', 'decimal'],
    ['array', 'string'],
  ])('flags %s against %s', (columnType, varType) => {
    expect(isTypeMismatch(columnType, varType)).toBe(true);
  });

  test('is case- and whitespace-insensitive', () => {
    expect(isTypeMismatch(' STRING ', 'Text')).toBe(false);
  });

  test.each([
    ['geo_point', 'string'],
    ['string', 'geo_point'],
    [undefined, 'string'],
    ['string', undefined],
  ])('gives no opinion on the unknown pairing %s / %s', (columnType, varType) => {
    expect(isTypeMismatch(columnType, varType)).toBe(false);
  });
});

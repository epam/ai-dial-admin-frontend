import { formatNumberWithExponent, formatNumberByDelimiter } from '@/src/utils/formatting/number-formatting';
import { describe, expect, test, vi } from 'vitest';

describe('Utils :: formatting :: formatNumber', () => {
  test('Should correctly handle thousands number', () => {
    const res = formatNumberWithExponent(135000);

    expect(res).toBe('135 K');
  });

  test('Should correctly handle hundreds number', () => {
    const res = formatNumberWithExponent(123);

    expect(res).toBe('123');
  });

  test('Should correctly handle million number and round to 1 sign', () => {
    const res = formatNumberWithExponent(13650000);

    expect(res).toBe('13.7 M');
  });

  // Rounding to one decimal can reach 1000, which under its own unit reads as "1000 K" rather than "1 M".
  test.each([
    [999500, '999.5 K'],
    [999999, '1 M'],
    [999999999, '1 B'],
  ])('Should carry %i into the next unit rather than reporting 1000 of the smaller one', (value, expected) => {
    expect(formatNumberWithExponent(value)).toBe(expected);
  });

  test('Should clamp at the largest unit rather than emitting undefined', () => {
    expect(formatNumberWithExponent(1e15)).toBe('1000 T');
  });
});

describe('Utils ::formatting :: formatNumberByDelimiter', () => {
  test('Should return empty string', () => {
    const result1 = formatNumberByDelimiter(void 0);
    const result2 = formatNumberByDelimiter(NaN);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  test('Should return formatted number without fractional', () => {
    const result = formatNumberByDelimiter(4444444, ' ');
    expect(result).toBe('4 444 444');
  });

  test('Should return formatted number with precision', () => {
    const result = formatNumberByDelimiter(4444444.9998321, ' ', '0');
    expect(result).toBe('4 444 445');
  });

  test('Should return formatted number', () => {
    const result = formatNumberByDelimiter(4444444.9998321, ' ');
    expect(result).toBe('4 444 445.00');
  });

  test('Should return formatted negative number', () => {
    const result = formatNumberByDelimiter(-4444444.9998321, ' ');
    expect(result).toBe('-4 444 445.00');
  });

  test('Should return formatted string', () => {
    const result = formatNumberByDelimiter('4444444.2228321');
    expect(result).toBe('4,444,444.22');
  });

  test('Should return formatted string', () => {
    const result = formatNumberByDelimiter('rherger');
    expect(result).toBe('');
  });
});

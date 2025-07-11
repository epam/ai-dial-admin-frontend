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

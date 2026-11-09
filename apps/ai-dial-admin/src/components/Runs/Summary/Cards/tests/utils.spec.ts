import { describe, expect, test } from 'vitest';

import { formatOverallScore, formatThreshold } from '../utils';

describe('Cards utils', () => {
  test('formatOverallScore pads to three decimals', () => {
    expect(formatOverallScore(0.58)).toBe('0.580');
    expect(formatOverallScore(1)).toBe('1.000');
    expect(formatOverallScore(0.8125)).toBe('0.813');
  });

  test('formatThreshold keeps the stored value', () => {
    expect(formatThreshold(0.6)).toBe('0.6');
    expect(formatThreshold(0)).toBe('0');
  });
});

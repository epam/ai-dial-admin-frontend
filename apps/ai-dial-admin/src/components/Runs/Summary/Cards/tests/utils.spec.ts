import { describe, expect, test } from 'vitest';

import { formatOverallScore, formatSecondsLabel, formatThreshold } from '../utils';

describe('Cards utils', () => {
  test('formatSecondsLabel appends the suffix to seconds with one decimal', () => {
    expect(formatSecondsLabel(632000, 's')).toBe('632s');
    expect(formatSecondsLabel(199.6, 's')).toBe('0.2s');
    expect(formatSecondsLabel(0, 's')).toBe('0s');
  });

  test('formatSecondsLabel is null for a missing duration', () => {
    expect(formatSecondsLabel(null, 's')).toBeNull();
  });

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

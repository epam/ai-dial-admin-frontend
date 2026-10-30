import { describe, expect, test } from 'vitest';

import { PassRateBand } from '@/src/components/Common/PassRateBar/models';
import { formatPassRatePercent, getPassRateBand } from '@/src/components/Common/PassRateBar/utils';

describe('getPassRateBand', () => {
  test.each([
    [1, PassRateBand.High],
    [0.985, PassRateBand.High],
    [0.7, PassRateBand.High],
    [0.699, PassRateBand.Medium],
    [0.4, PassRateBand.Medium],
    [0.399, PassRateBand.Low],
    [0, PassRateBand.Low],
  ])('maps a rate of %s to the %s band', (rate, band) => {
    expect(getPassRateBand(rate)).toBe(band);
  });
});

describe('formatPassRatePercent', () => {
  test('formats one decimal and strips trailing zeros', () => {
    expect(formatPassRatePercent(0.985)).toBe('98.5%');
    expect(formatPassRatePercent(1)).toBe('100%');
    expect(formatPassRatePercent(0.5)).toBe('50%');
    expect(formatPassRatePercent(0)).toBe('0%');
  });
});

import { describe, expect, test } from 'vitest';

import { formatPassRateDelta, segmentPassRate } from '@/src/components/TestSuites/Trends/Kpi/utils/pass-rate';

describe('segmentPassRate', () => {
  test('returns null when segments are missing or empty', () => {
    expect(segmentPassRate(null)).toBeNull();
    expect(segmentPassRate({ above: 0, total: 0 })).toBeNull();
  });

  test('returns above / total', () => {
    expect(segmentPassRate({ above: 197, total: 200 })).toBe(0.985);
  });
});

describe('formatPassRateDelta', () => {
  test('returns signed percentage-point delta', () => {
    expect(formatPassRateDelta(0.985, 0.665)).toBe('+32%');
    expect(formatPassRateDelta(0.5, 0.7)).toBe('-20%');
  });

  test('returns null when either rate is missing or delta is zero', () => {
    expect(formatPassRateDelta(null, 0.5)).toBeNull();
    expect(formatPassRateDelta(0.5, null)).toBeNull();
    expect(formatPassRateDelta(0.5, 0.5)).toBeNull();
  });
});

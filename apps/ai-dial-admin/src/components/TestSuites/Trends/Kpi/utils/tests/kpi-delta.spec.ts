import { describe, expect, test } from 'vitest';

import {
  formatCostDelta,
  formatRuntimeDelta,
  formatScoreDelta,
} from '@/src/components/TestSuites/Trends/Kpi/utils/kpi-delta';

describe('formatScoreDelta', () => {
  test('returns signed score delta', () => {
    expect(formatScoreDelta(0.58, 0.46)).toBe('+0.12');
    expect(formatScoreDelta(0.4, 0.5)).toBe('-0.1');
  });

  test('returns null when either score is missing or delta is zero', () => {
    expect(formatScoreDelta(null, 0.5)).toBeNull();
    expect(formatScoreDelta(0.5, null)).toBeNull();
    expect(formatScoreDelta(0.5, 0.5)).toBeNull();
  });
});

describe('formatRuntimeDelta', () => {
  test('formats millisecond and second deltas', () => {
    expect(formatRuntimeDelta(110, 100)).toBe('+10ms');
    expect(formatRuntimeDelta(2000, 1000)).toBe('+1s');
    expect(formatRuntimeDelta(500, 1500)).toBe('-1s');
  });

  test('returns null when either value is missing or delta is zero', () => {
    expect(formatRuntimeDelta(null, 100)).toBeNull();
    expect(formatRuntimeDelta(100, null)).toBeNull();
    expect(formatRuntimeDelta(100, 100)).toBeNull();
  });
});

describe('formatCostDelta', () => {
  test('returns signed cost delta', () => {
    expect(formatCostDelta(10.7, 5.7)).toBe('+$5');
    expect(formatCostDelta(1, 3)).toBe('-$2');
  });

  test('returns null when either value is missing or delta is zero', () => {
    expect(formatCostDelta(null, 1)).toBeNull();
    expect(formatCostDelta(1, null)).toBeNull();
    expect(formatCostDelta(1, 1)).toBeNull();
  });
});

import { describe, expect, test } from 'vitest';

import { buildComboYTicks, niceCeil } from '@/src/components/TestSuites/Trends/CostRuntime/utils/combo-axis';

describe('niceCeil', () => {
  test('rounds up to a 1/2/2.5/3/5 × 10^n ceiling', () => {
    expect(niceCeil(37)).toBe(50);
    expect(niceCeil(20)).toBe(20);
    expect(niceCeil(29.25)).toBe(30);
    expect(niceCeil(340)).toBe(500);
    expect(niceCeil(0.012)).toBe(0.02);
  });

  test('returns 1 for non-positive input', () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(-5)).toBe(1);
  });
});

describe('buildComboYTicks', () => {
  test('returns five ticks from a step-based nice ceiling down to 0', () => {
    // max 37 → rough step 9.25 → step 10 → ceiling 40
    expect(buildComboYTicks(37)).toEqual([40, 30, 20, 10, 0]);
    expect(buildComboYTicks(20)).toEqual([20, 15, 10, 5, 0]);
    // ~117s in ms → step 30_000 → ceiling 120_000 (not 200_000)
    expect(buildComboYTicks(117_224)).toEqual([120_000, 90_000, 60_000, 30_000, 0]);
  });

  test('returns a unit scale when max is missing or zero', () => {
    expect(buildComboYTicks(0)).toEqual([1, 0.75, 0.5, 0.25, 0]);
  });
});

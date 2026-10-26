import { describe, expect, test } from 'vitest';

import {
  comboTrendMaxTotal,
  comboTrendTotal,
  hasComboTrendData,
} from '@/src/components/TestSuites/Trends/CostRuntime/utils/fold-combo-points';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';

const point = (source: number | null, metrics: number | null): ComboTrendPoint => ({
  runId: 'r',
  runName: 'Run#1',
  computedAtMs: 1,
  source,
  metrics,
});

describe('comboTrendTotal', () => {
  test('sums present segments and treats a missing segment as 0', () => {
    expect(comboTrendTotal(point(2, 3))).toBe(5);
    expect(comboTrendTotal(point(2, null))).toBe(2);
    expect(comboTrendTotal(point(null, 3))).toBe(3);
  });

  test('returns null when both segments are missing', () => {
    expect(comboTrendTotal(point(null, null))).toBeNull();
  });
});

describe('comboTrendMaxTotal / hasComboTrendData', () => {
  test('finds the max stack and detects any finite series', () => {
    const points = [point(null, null), point(1, 2), point(10, null)];
    expect(comboTrendMaxTotal(points)).toBe(10);
    expect(hasComboTrendData(points)).toBe(true);
    expect(hasComboTrendData([point(null, null)])).toBe(false);
  });
});

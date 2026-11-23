import { describe, expect, test } from 'vitest';

import {
  buildMonthCostWindows,
  formatGroupedMonthCost,
  formatMonthCostDelta,
  sumDeploymentCostParts,
} from '@/src/components/EvalTrendsTab/deployment-month-cost';

describe('buildMonthCostWindows', () => {
  test('builds month-to-date and matching previous-month spans', () => {
    const windows = buildMonthCostWindows(new Date(2026, 10, 10, 15, 30, 0));

    expect(windows.current.fromMs).toBe(new Date(2026, 10, 1, 0, 0, 0, 0).getTime());
    expect(windows.current.toMs).toBe(new Date(2026, 10, 10, 23, 59, 59, 999).getTime());
    expect(windows.previous.fromMs).toBe(new Date(2026, 9, 1, 0, 0, 0, 0).getTime());
    expect(windows.previous.toMs).toBe(new Date(2026, 9, 10, 23, 59, 59, 999).getTime());
    expect(windows.current.label).toBe('01 - 10 Nov, 2026');
    expect(windows.previous.label).toBe('01 - 10 Oct, 2026');
  });

  test('clamps the previous end day when the current day is past last month length', () => {
    const windows = buildMonthCostWindows(new Date(2026, 2, 31, 12, 0, 0));

    expect(windows.previous.fromMs).toBe(new Date(2026, 1, 1, 0, 0, 0, 0).getTime());
    expect(windows.previous.toMs).toBe(new Date(2026, 1, 28, 23, 59, 59, 999).getTime());
    expect(windows.previous.label).toBe('01 - 28 Feb, 2026');
  });
});

describe('sumDeploymentCostParts', () => {
  test('sums both phases when present', () => {
    expect(sumDeploymentCostParts({ totalTestCaseCost: 10, totalMetricEvalCost: 2.5 })).toBe(12.5);
  });

  test('treats a null phase as zero when the other has a figure', () => {
    expect(sumDeploymentCostParts({ totalTestCaseCost: 4, totalMetricEvalCost: null })).toBe(4);
    expect(sumDeploymentCostParts({ totalTestCaseCost: null, totalMetricEvalCost: 1.25 })).toBe(1.25);
  });

  test('returns null when both phases are missing', () => {
    expect(sumDeploymentCostParts({ totalTestCaseCost: null, totalMetricEvalCost: null })).toBeNull();
    expect(sumDeploymentCostParts(null)).toBeNull();
  });
});

describe('formatGroupedMonthCost', () => {
  test('groups thousands and omits cents for whole dollars', () => {
    expect(formatGroupedMonthCost(1842)).toBe('$1,842');
  });

  test('keeps cents when they are non-zero', () => {
    expect(formatGroupedMonthCost(1842.5)).toBe('$1,842.50');
  });
});

describe('formatMonthCostDelta', () => {
  test('formats signed deltas and hides zero or missing sides', () => {
    expect(formatMonthCostDelta(1842, 1628)).toBe('+$214');
    expect(formatMonthCostDelta(100, 250)).toBe('-$150');
    expect(formatMonthCostDelta(10, 10)).toBeNull();
    expect(formatMonthCostDelta(null, 10)).toBeNull();
    expect(formatMonthCostDelta(10, null)).toBeNull();
  });
});

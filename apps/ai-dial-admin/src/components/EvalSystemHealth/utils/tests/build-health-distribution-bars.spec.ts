import { describe, expect, test } from 'vitest';

import { buildHealthDistributionBars } from '@/src/components/EvalSystemHealth/utils/build-health-distribution-bars';
import { HealthDistributionWeek } from '@/src/models/evaluation/health-distribution';

// Monday 3 November 2025, 00:00:00 UTC.
const NOV_3 = Date.UTC(2025, 10, 3);
const WEEK_MS = 604_800_000;

const week = (healthyCount: number, failingCount: number, weekStart = NOV_3): HealthDistributionWeek => ({
  weekStart,
  healthyCount,
  failingCount,
  suiteCount: healthyCount + failingCount,
});

describe('buildHealthDistributionBars', () => {
  test('states the counts and the shares of a typical week', () => {
    expect(buildHealthDistributionBars([week(21, 11)])).toEqual([
      {
        weekStart: NOV_3,
        label: 'Nov 3',
        healthyCount: 21,
        failingCount: 11,
        suiteCount: 32,
        healthyShare: 65.6,
        failingShare: 34.4,
      },
    ]);
  });

  test('gives a week with no suite no share, so no bar is drawn for it', () => {
    const [bar] = buildHealthDistributionBars([week(0, 0)]);

    expect(bar.healthyShare).toBeNull();
    expect(bar.failingShare).toBeNull();
    expect(bar.suiteCount).toBe(0);
  });

  test('gives an all-healthy week 100 and 0', () => {
    const [bar] = buildHealthDistributionBars([week(4, 0)]);

    expect(bar.healthyShare).toBe(100);
    expect(bar.failingShare).toBe(0);
  });

  test('gives an all-failing week 0 and 100', () => {
    const [bar] = buildHealthDistributionBars([week(0, 7)]);

    expect(bar.healthyShare).toBe(0);
    expect(bar.failingShare).toBe(100);
  });

  test.each([
    [1, 15],
    [1, 7],
    [1, 2],
    [2, 1],
    [5, 6],
    [7, 13],
  ])('makes the shares of %i healthy and %i failing add up to exactly 100', (healthy, failing) => {
    const [bar] = buildHealthDistributionBars([week(healthy, failing)]);

    expect(Math.round(((bar.healthyShare ?? 0) + (bar.failingShare ?? 0)) * 10) / 10).toBe(100);
  });

  test('keeps the backend order and labels each week by its own start', () => {
    const bars = buildHealthDistributionBars([
      week(1, 1, NOV_3),
      week(2, 2, NOV_3 + WEEK_MS),
      week(3, 3, NOV_3 + 2 * WEEK_MS),
    ]);

    expect(bars.map((bar) => bar.label)).toEqual(['Nov 3', 'Nov 10', 'Nov 17']);
  });

  test('names the week by its UTC date whatever the local time zone', () => {
    // 00:00 UTC on 3 Nov is still 2 Nov in zones west of Greenwich.
    expect(buildHealthDistributionBars([week(1, 0)])[0].label).toBe('Nov 3');
  });

  test('takes the suite count from the response rather than recomputing it', () => {
    const [bar] = buildHealthDistributionBars([{ weekStart: NOV_3, healthyCount: 1, failingCount: 1, suiteCount: 2 }]);

    expect(bar.suiteCount).toBe(2);
  });

  test('returns no bars for no weeks', () => {
    expect(buildHealthDistributionBars([])).toEqual([]);
  });
});

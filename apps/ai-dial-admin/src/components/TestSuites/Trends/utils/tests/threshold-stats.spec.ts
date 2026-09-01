import { describe, expect, test } from 'vitest';

import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { aggregateThresholdStats } from '@/src/components/TestSuites/Trends/utils/threshold-stats';

const point = (overrides: Partial<TrendsRunPoint> & Pick<TrendsRunPoint, 'runId'>): TrendsRunPoint => ({
  runName: overrides.runId,
  computedAtMs: 0,
  overallScore: null,
  durationMs: null,
  isFailed: false,
  ...overrides,
});

describe('aggregateThresholdStats', () => {
  test('returns null when threshold is unset', () => {
    const runs = [point({ runId: 'a', overallScore: 0.8 })];
    expect(aggregateThresholdStats(runs, undefined)).toBeNull();
    expect(aggregateThresholdStats(runs, null)).toBeNull();
  });

  test('buckets pass, fail, and error for a mixed window', () => {
    const runs = [
      point({ runId: 'pass', overallScore: 0.9 }),
      point({ runId: 'fail', overallScore: 0.2 }),
      point({ runId: 'error', overallScore: 0.95, isFailed: true }),
    ];

    expect(aggregateThresholdStats(runs, 0.5)).toEqual({
      passed: 1,
      failed: 1,
      error: 1,
      total: 3,
    });
  });

  test('counts exact threshold as pass', () => {
    expect(aggregateThresholdStats([point({ runId: 'exact', overallScore: 0.5 })], 0.5)).toEqual({
      passed: 1,
      failed: 0,
      error: 0,
      total: 1,
    });
  });

  test('treats threshold 0 as configured and scores accordingly', () => {
    expect(
      aggregateThresholdStats(
        [point({ runId: 'zero', overallScore: 0 }), point({ runId: 'neg', overallScore: -0.1 })],
        0,
      ),
    ).toEqual({
      passed: 1,
      failed: 1,
      error: 0,
      total: 2,
    });
  });

  test('counts failed runs as error even when they have a score', () => {
    expect(aggregateThresholdStats([point({ runId: 'failed', overallScore: 0.99, isFailed: true })], 0.5)).toEqual({
      passed: 0,
      failed: 0,
      error: 1,
      total: 1,
    });
  });

  test('counts unscored non-failed runs only toward total', () => {
    expect(aggregateThresholdStats([point({ runId: 'pending', overallScore: null })], 0.5)).toEqual({
      passed: 0,
      failed: 0,
      error: 0,
      total: 1,
    });
  });
});

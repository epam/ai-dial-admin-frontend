import { describe, expect, test } from 'vitest';

import {
  chunkSuiteIds,
  combineSuitePassRateSummaries,
  EMPTY_SUITE_PASS_RATE_SUMMARY,
  getPassRateTrend,
  SUITE_PASS_RATE_BATCH_SIZE,
} from '../suite-pass-rate';

describe('chunkSuiteIds', () => {
  test('returns no batches for an empty or blank id list', () => {
    expect(chunkSuiteIds([])).toEqual([]);
    expect(chunkSuiteIds(['', ''])).toEqual([]);
  });

  test('dedupes ids and chunks at the batch size', () => {
    const ids = Array.from({ length: SUITE_PASS_RATE_BATCH_SIZE + 2 }, (_, index) => `suite-${index}`);
    ids.push('suite-0');

    const batches = chunkSuiteIds(ids);

    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(SUITE_PASS_RATE_BATCH_SIZE);
    expect(batches[1]).toEqual([`suite-${SUITE_PASS_RATE_BATCH_SIZE}`, `suite-${SUITE_PASS_RATE_BATCH_SIZE + 1}`]);
  });
});

describe('combineSuitePassRateSummaries', () => {
  test('returns an empty summary when there are no batches', () => {
    expect(combineSuitePassRateSummaries([])).toEqual(EMPTY_SUITE_PASS_RATE_SUMMARY);
  });

  test('weights each suite equally across batches', () => {
    const combined = combineSuitePassRateSummaries([
      { passRate: 1, previousPassRate: 0.5, suiteCount: 1, previousSuiteCount: 1 },
      { passRate: 0, previousPassRate: 0, suiteCount: 1, previousSuiteCount: 1 },
    ]);

    expect(combined.passRate).toBe(0.5);
    expect(combined.previousPassRate).toBe(0.25);
    expect(combined.suiteCount).toBe(2);
    expect(combined.previousSuiteCount).toBe(2);
  });

  test('omits a rate when no batch contributed a count for that side', () => {
    const combined = combineSuitePassRateSummaries([
      { passRate: 0.8, previousPassRate: null, suiteCount: 2, previousSuiteCount: 0 },
      { passRate: null, previousPassRate: null, suiteCount: 0, previousSuiteCount: 0 },
    ]);

    expect(combined.passRate).toBe(0.8);
    expect(combined.previousPassRate).toBeNull();
    expect(combined.suiteCount).toBe(2);
    expect(combined.previousSuiteCount).toBe(0);
  });
});

describe('getPassRateTrend', () => {
  test('returns up when the latest mean is higher', () => {
    expect(getPassRateTrend(0.613, 0.5)).toBe('up');
  });

  test('returns down when the latest mean is lower', () => {
    expect(getPassRateTrend(0.4, 0.6)).toBe('down');
  });

  test('returns null when either side is missing or the rates are equal', () => {
    expect(getPassRateTrend(null, 0.5)).toBeNull();
    expect(getPassRateTrend(0.5, null)).toBeNull();
    expect(getPassRateTrend(0.5, 0.5)).toBeNull();
  });
});

import { describe, expect, test } from 'vitest';

import {
  AVG_LATENCY_ALIAS,
  BUCKET_ALIAS,
  CALLS_ALIAS,
  COMPLETION_TOKENS_ALIAS,
  FAILED_ALIAS,
  P50_LATENCY_ALIAS,
  P95_LATENCY_ALIAS,
  PROMPT_TOKENS_ALIAS,
  SPEND_ALIAS,
  CALLERS_ALIAS,
} from '@/src/components/Analytics/Usage/queries';
import {
  EMPTY_MEASURES,
  foldBreakdownRows,
  foldBucketPoints,
  foldDimensionBuckets,
  foldSpendBuckets,
  isMissingValue,
  readMeasures,
  toNumber,
} from '@/src/components/Analytics/Usage/utils/folds';
import { StructuredQueryResult } from '@/src/models/analytics/query';

const result = (rows: Record<string, unknown>[]) => ({ rows }) as StructuredQueryResult;

describe('isMissingValue', () => {
  test.each([[null], [void 0], [''], ['   '], ['undefined']])('reads %p as carrying no value', (value) => {
    expect(isMissingValue(value)).toBe(true);
  });

  test.each([['gpt-4o'], [0], [false]])('reads %p as a value', (value) => {
    expect(isMissingValue(value)).toBe(false);
  });
});

describe('toNumber', () => {
  test('passes a number through', () => {
    expect(toNumber(42.5)).toBe(42.5);
  });

  test('parses a decimal the backend sent as text', () => {
    expect(toNumber('1699.04')).toBe(1699.04);
  });

  test.each([[null], [void 0], [''], ['NaN'], ['not a number']])('returns nothing for %p', (value) => {
    expect(toNumber(value)).toBeNull();
  });
});

describe('readMeasures', () => {
  test('reads every figure the aggregate carries', () => {
    const measures = readMeasures({
      [CALLS_ALIAS]: 10,
      [CALLERS_ALIAS]: 3,
      [FAILED_ALIAS]: 1,
      [AVG_LATENCY_ALIAS]: 250.5,
      [SPEND_ALIAS]: '4.25',
      [PROMPT_TOKENS_ALIAS]: 100,
      [COMPLETION_TOKENS_ALIAS]: 40,
      [P50_LATENCY_ALIAS]: 200,
      [P95_LATENCY_ALIAS]: 900,
    });

    expect(measures).toMatchObject({
      calls: 10,
      callers: 3,
      failed: 1,
      avgLatencyMs: 250.5,
      spend: 4.25,
      promptTokens: 100,
      completionTokens: 40,
      p50LatencyMs: 200,
      p95LatencyMs: 900,
    });
  });

  test('counts an absent count as zero and an absent sum as unknown', () => {
    const measures = readMeasures({});

    expect(measures.calls).toBe(0);
    expect(measures.spend).toBeNull();
    expect(measures.p95LatencyMs).toBeNull();
  });
});

describe('foldBucketPoints', () => {
  test('orders the buckets by time whatever order they arrived in', () => {
    const points = foldBucketPoints(
      result([
        { [BUCKET_ALIAS]: '2026-09-17T13:00:00Z', [CALLS_ALIAS]: 2 },
        { [BUCKET_ALIAS]: '2026-09-17T12:00:00Z', [CALLS_ALIAS]: 1 },
      ]),
    );

    expect(points.map((point) => point.measures.calls)).toEqual([1, 2]);
  });

  test('drops a row whose bucket is not a timestamp', () => {
    expect(foldBucketPoints(result([{ [BUCKET_ALIAS]: 'not a date', [CALLS_ALIAS]: 1 }]))).toEqual([]);
  });

  test('returns nothing for an absent response', () => {
    expect(foldBucketPoints(null)).toEqual([]);
  });
});

describe('foldSpendBuckets', () => {
  test('reads the bucket and its spend', () => {
    expect(foldSpendBuckets(result([{ [BUCKET_ALIAS]: '2026-09-17T00:00:00Z', [SPEND_ALIAS]: '426.37' }]))).toEqual([
      { bucketMs: Date.parse('2026-09-17T00:00:00Z'), spend: 426.37 },
    ]);
  });

  test('counts a bucket with no priced rows as zero spend', () => {
    expect(foldSpendBuckets(result([{ [BUCKET_ALIAS]: '2026-09-17T00:00:00Z', [SPEND_ALIAS]: null }]))[0].spend).toBe(
      0,
    );
  });
});

describe('foldDimensionBuckets', () => {
  test('keys each row by its bucket and dimension value', () => {
    const points = foldDimensionBuckets(
      result([{ [BUCKET_ALIAS]: '2026-09-17T12:00:00Z', deployment: 'gpt-4o', [CALLS_ALIAS]: 7 }]),
      'deployment',
    );

    expect(points).toEqual([{ bucketMs: Date.parse('2026-09-17T12:00:00Z'), seriesId: 'gpt-4o', calls: 7 }]);
  });

  test('gives a row with no dimension value an id of its own rather than an empty one', () => {
    const [point] = foldDimensionBuckets(
      result([{ [BUCKET_ALIAS]: '2026-09-17T12:00:00Z', deployment: '', [CALLS_ALIAS]: 1 }]),
      'deployment',
    );

    expect(point.seriesId).toBe('deployment:missing');
  });
});

describe('foldBreakdownRows', () => {
  test('reads the dimension value as the row id and label', () => {
    const [row] = foldBreakdownRows(result([{ deployment: 'gpt-4o', [CALLS_ALIAS]: 3 }]), 'deployment');

    expect(row).toMatchObject({ id: 'gpt-4o', label: 'gpt-4o', isFallbackLabel: false });
  });

  test('flags a missing dimension value so the view can name it', () => {
    const [row] = foldBreakdownRows(result([{ deployment: null, [CALLS_ALIAS]: 3 }]), 'deployment');

    expect(row).toMatchObject({ id: 'deployment:missing', label: '', isFallbackLabel: true });
  });
});

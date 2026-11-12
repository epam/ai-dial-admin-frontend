import { describe, expect, test } from 'vitest';

import {
  buildRowDeltas,
  buildSingleValueFigure,
  getBucketWidthMs,
  toTimedValues,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-view-options';

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse('2026-10-26T00:00:00Z');

describe('buildSingleValueFigure', () => {
  test('reads the column from the only row, with its change when compared', () => {
    expect(buildSingleValueFigure([{ calls: 120 }], 'calls', [{ calls: 100 }])).toEqual({
      value: 120,
      previous: 100,
      deltaRatio: 0.2,
    });
  });

  test('has no change without a compared window or against zero', () => {
    expect(buildSingleValueFigure([{ cost: '3.5' }], 'cost')).toEqual({ value: 3.5, previous: null, deltaRatio: null });
    expect(buildSingleValueFigure([{ cost: 2 }], 'cost', [{ cost: 0 }]).deltaRatio).toBeNull();
    expect(buildSingleValueFigure([{ cost: null }], 'cost').value).toBeNull();
  });
});

describe('toTimedValues', () => {
  test('reads epoch millis and ISO instants in time order, dropping rows without a time', () => {
    const rows = [
      { bucket: '2026-10-26T01:00:00Z', calls: '5' },
      { bucket: START, calls: 3 },
      { bucket: null, calls: 9 },
    ];
    expect(toTimedValues(rows, 'bucket', 'calls')).toEqual([
      { bucketMs: START, value: 3 },
      { bucketMs: Date.parse('2026-10-26T01:00:00Z'), value: 5 },
    ]);
  });
});

describe('getBucketWidthMs', () => {
  test('reads the width off the closest two buckets', () => {
    const points = [0, 2, 3, 5].map((hour) => ({ bucketMs: START + hour * HOUR_MS, value: 1 }));
    expect(getBucketWidthMs(points)).toBe(HOUR_MS);
  });

  test('falls back to an hour with fewer than two buckets', () => {
    expect(getBucketWidthMs([{ bucketMs: START, value: 1 }])).toBe(HOUR_MS);
  });
});

describe('buildRowDeltas', () => {
  test('matches rows by their dimension values and reads each aggregate change', () => {
    const rows = [
      { model: 'a', calls: 30, cost: 2 },
      { model: 'b', calls: 10, cost: 1 },
    ];
    const previous = [
      { model: 'b', calls: 20, cost: 0 },
      { model: 'a', calls: 20, cost: 1 },
    ];
    expect(buildRowDeltas(rows, previous, ['model'], ['calls', 'cost'])).toEqual([
      { calls: 0.5, cost: 1 },
      { calls: -0.5, cost: null },
    ]);
  });

  test('gives no change to a row the compared window lacks', () => {
    expect(buildRowDeltas([{ model: 'new', calls: 3 }], [], ['model'], ['calls'])).toEqual([{ calls: null }]);
  });

  test('matches the only row of a result with no dimension', () => {
    expect(buildRowDeltas([{ calls: 15 }], [{ calls: 10 }], [], ['calls'])).toEqual([{ calls: 0.5 }]);
  });
});

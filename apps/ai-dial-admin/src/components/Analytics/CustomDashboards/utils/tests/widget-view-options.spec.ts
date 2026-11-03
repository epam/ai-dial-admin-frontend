import { describe, expect, test } from 'vitest';

import {
  buildRowDeltas,
  buildShareFigure,
  buildSingleValueFigure,
  getBucketWidthMs,
  getDeltaRatio,
  toTimedValues,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-view-options';
import { ChartColors } from '@/src/components/Common/MetricCard/models';

const COLORS: ChartColors = {
  success: '#0f0',
  warning: '#ff0',
  error: '#f00',
  accent: '#00f',
  neutral: '#888',
  value: '#fff',
  track: '#222',
};

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse('2026-10-26T00:00:00Z');

describe('getDeltaRatio', () => {
  test('is the relative change against the compared value', () => {
    expect(getDeltaRatio(150, 100)).toBe(0.5);
  });

  test('is null without both values or against zero', () => {
    expect(getDeltaRatio(null, 100)).toBeNull();
    expect(getDeltaRatio(10, null)).toBeNull();
    expect(getDeltaRatio(10, 0)).toBeNull();
  });
});

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

describe('buildShareFigure', () => {
  test('keeps the five largest values, folds the rest into Others and labels each share', () => {
    const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name, index) => ({ model: name, calls: 10 - index }));
    const { slices, total } = buildShareFigure(COLORS, rows, 'model', 'calls', 'Others');

    expect(total).toBe(49);
    expect(slices.map((slice) => slice.label)).toEqual(['a', 'b', 'c', 'd', 'e', 'Others']);
    expect(slices[5]).toEqual(expect.objectContaining({ value: 9, isOther: true, color: COLORS.neutral }));
    expect(slices[0]).toEqual(expect.objectContaining({ valueLabel: '10', shareLabel: '20%' }));
  });

  test('leaves out zero values and adds no Others when everything fits', () => {
    const rows = [
      { model: 'a', calls: 2 },
      { model: 'b', calls: 0 },
    ];
    expect(buildShareFigure(COLORS, rows, 'model', 'calls', 'Others').slices.map((slice) => slice.label)).toEqual([
      'a',
    ]);
  });

  test('names a share with no value instead of leaving its label blank', () => {
    const rows = [
      { model: '', calls: 2 },
      { model: null, calls: 1 },
    ];
    const { slices } = buildShareFigure(COLORS, rows, 'model', 'calls', 'Others', undefined, '(no value)');
    expect(slices.map((slice) => slice.label)).toEqual(['(no value)', '(no value)']);
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

import { describe, expect, test, vi } from 'vitest';

import { BucketPoint } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import {
  HEATMAP_DAYS,
  HEATMAP_HOURS,
  buildHeatmapMatrix,
  getHeatmapCellColor,
  getHeatmapCellOpacity,
  getHeatmapHourColId,
  isFutureCell,
} from '@/src/components/Analytics/Usage/utils/heatmap';

// The grid is the reader's own week, so every fixture is a local date.
const local = (year: number, month: number, day: number, hour = 0) => new Date(year, month - 1, day, hour);

const WEEK = { startDate: local(2026, 9, 14), endDate: local(2026, 9, 21) };

const point = (date: Date, calls: number): BucketPoint => ({
  bucketMs: date.getTime(),
  measures: { ...EMPTY_MEASURES, calls },
});

const build = (points: BucketPoint[]) => buildHeatmapMatrix(points, WEEK, (dayStartMs) => String(dayStartMs));

describe('buildHeatmapMatrix', () => {
  test('draws all seven days of the week whatever the response carried', () => {
    expect(build([point(local(2026, 9, 16, 10), 5)]).rows).toHaveLength(HEATMAP_DAYS);
  });

  test('draws an empty week as an empty grid rather than no grid', () => {
    const matrix = build([]);

    expect(matrix.rows).toHaveLength(HEATMAP_DAYS);
    expect(matrix.maxValue).toBe(0);
  });

  test('gives every row a cell for each hour', () => {
    expect(Object.keys(build([]).rows[0].values ?? {})).toHaveLength(HEATMAP_HOURS);
  });

  test('places a bucket on its own day and hour', () => {
    const matrix = build([point(local(2026, 9, 16, 10), 5)]);

    expect(matrix.rows[2].values?.[getHeatmapHourColId(10)]).toBe(5);
    expect(matrix.rows[2].dayStartMs).toBe(local(2026, 9, 16).getTime());
  });

  test('sums several buckets landing in one hour', () => {
    const matrix = build([point(local(2026, 9, 16, 10), 5), point(local(2026, 9, 16, 10), 7)]);

    expect(matrix.rows[2].values?.[getHeatmapHourColId(10)]).toBe(12);
  });

  test('reports the busiest cell, which the shading is scaled against', () => {
    expect(build([point(local(2026, 9, 15, 3), 4), point(local(2026, 9, 17, 9), 11)]).maxValue).toBe(11);
  });

  test('ignores a bucket outside the week rather than folding it into an edge', () => {
    const matrix = build([point(local(2026, 9, 28, 10), 99)]);

    expect(matrix.maxValue).toBe(0);
    expect(matrix.rows.every((row) => Object.values(row.values ?? {}).every((value) => value === 0))).toBe(true);
  });
});

describe('getHeatmapCellOpacity', () => {
  test('leaves an hour with no calls unshaded, so it reads apart from the quietest busy hour', () => {
    expect(getHeatmapCellOpacity(0, 100)).toBe(0);
  });

  test('gives the busiest cell full intensity', () => {
    expect(getHeatmapCellOpacity(100, 100)).toBe(1);
  });

  test('keeps a small value visible rather than fading it to nothing', () => {
    expect(getHeatmapCellOpacity(1, 1000)).toBeGreaterThanOrEqual(0.12);
  });

  test('shades nothing when the week itself was empty', () => {
    expect(getHeatmapCellOpacity(5, 0)).toBe(0);
  });
});

describe('getHeatmapCellColor', () => {
  test('paints in the one hue the legend also reads', () => {
    expect(getHeatmapCellColor(0.5)).toBe('rgba(125, 164, 255, 0.5)');
  });
});

describe('isFutureCell', () => {
  const now = local(2026, 9, 17, 12).getTime();

  test('reports an hour that has not happened yet', () => {
    expect(isFutureCell(local(2026, 9, 17).getTime(), 15, now)).toBe(true);
  });

  test('reports nothing for an hour already past', () => {
    expect(isFutureCell(local(2026, 9, 17).getTime(), 9, now)).toBe(false);
  });

  test('treats the hour in progress as past, since it already holds calls', () => {
    expect(isFutureCell(local(2026, 9, 17).getTime(), 12, now)).toBe(false);
  });

  test('reads the clock when no reference is given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(local(2026, 9, 17, 12));

    expect(isFutureCell(local(2026, 9, 18).getTime(), 0)).toBe(true);

    vi.useRealTimers();
  });
});

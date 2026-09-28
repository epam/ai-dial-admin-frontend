import { HeatMapGridRow } from '@/src/components/Common/HeatMap/models';
import { BucketPoint, HeatmapMetric } from '@/src/components/Analytics/Usage/models';
import { TimeRange } from '@/src/models/time-range';

export const HEATMAP_HOURS = 24;

export const HEATMAP_DAYS = 7;

export const HEATMAP_COL_PREFIX = 'hour_';

export const getHeatmapHourColId = (hour: number): string => `${HEATMAP_COL_PREFIX}${hour}`;

export interface HeatmapRow extends HeatMapGridRow {
  dayStartMs: number;
}

export interface HeatmapMatrix {
  rows: HeatmapRow[];
  maxValue: number;
}

/**
 * Every day of the week gets a row and every hour a cell, whether or not the response carried one —
 * a week with traffic on a single day is still a week, and an empty week is an empty grid rather
 * than a missing one.
 */
export const buildHeatmapMatrix = (
  points: BucketPoint[],
  week: TimeRange,
  formatDayLabel: (dayStartMs: number) => string,
  metric: HeatmapMetric = HeatmapMetric.Calls,
): HeatmapMatrix => {
  const byCell = new Map<string, number>();
  // Both figures ride the same hourly response, so switching what the grid paints reads nothing.
  const readMetric = (point: BucketPoint) =>
    metric === HeatmapMetric.Cost ? (point.measures.spend ?? 0) : point.measures.calls;

  for (const point of points) {
    const date = new Date(point.bucketMs);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const key = `${dayStart}|${date.getHours()}`;

    byCell.set(key, (byCell.get(key) ?? 0) + readMetric(point));
  }

  // Read off the built grid rather than the response: a bucket outside the week paints no cell, so
  // letting it set the ceiling would wash out every cell that does.
  let maxValue = 0;

  const rows = Array.from({ length: HEATMAP_DAYS }, (_, dayIndex) => {
    const day = new Date(week.startDate);
    day.setDate(day.getDate() + dayIndex);
    const dayStartMs = day.getTime();

    return {
      id: String(dayStartMs),
      dayStartMs,
      label: formatDayLabel(dayStartMs),
      values: Object.fromEntries(
        Array.from({ length: HEATMAP_HOURS }, (_, hour) => {
          const value = byCell.get(`${dayStartMs}|${hour}`) ?? 0;
          maxValue = Math.max(maxValue, value);

          return [getHeatmapHourColId(hour), value];
        }),
      ),
    };
  });

  return { rows, maxValue };
};

/** An hour that has not happened yet is drawn empty and says nothing — it is not a quiet hour. */
export const isFutureCell = (dayStartMs: number, hour: number, now: number = Date.now()): boolean =>
  dayStartMs + hour * 60 * 60 * 1000 > now;

export const HEATMAP_ACCENT_RGB = '125, 164, 255';

export const HEATMAP_SCALE_STEPS = 5;

export const getHeatmapCellColor = (opacity: number): string => `rgba(${HEATMAP_ACCENT_RGB}, ${opacity})`;

/**
 * Intensity relative to the week's busiest cell. Zero keeps the plain background, so an hour with
 * no calls stays visually distinct from the quietest hour that had some.
 */
export const getHeatmapCellOpacity = (value: number, maxValue: number): number => {
  if (!value || !maxValue) {
    return 0;
  }

  const MIN_VISIBLE = 0.12;
  return MIN_VISIBLE + (value / maxValue) * (1 - MIN_VISIBLE);
};

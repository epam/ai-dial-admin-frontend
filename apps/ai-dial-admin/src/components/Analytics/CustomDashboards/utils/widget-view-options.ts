import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { DonutSliceView, TimedValue } from '@/src/components/Analytics/Usage/models';
import { formatChartNumber, getSliceColor } from '@/src/components/Analytics/Usage/utils/chart-options';
import { formatPercent, getDeltaRatio } from '@/src/components/Analytics/Usage/utils/format';
import { ChartColors } from '@/src/components/Common/MetricCard/models';

type ResultRows = Array<Record<string, unknown>>;

// The donut names its largest slices and folds the rest, as the usage dashboard's share chart does.
const SHARE_SLICE_COUNT = 5;

export interface SingleValueFigure {
  value: number | null;
  // The compared window's value; null without a compared run.
  previous: number | null;
  // The change against the compared window; null without one, or when the compared value is zero.
  deltaRatio: number | null;
}

const toNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// The service answers a date-time column as epoch milliseconds; an ISO string is read the same way.
const toTimeMs = (value: unknown): number | null => {
  if (value == null) return null;
  const ms = typeof value === 'number' ? value : new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/**
 * Each row's change per aggregate column against the compared result's row with the same dimension values, the
 * way the usage breakdown matches its rows. A row the compared window lacks has no change.
 */
export const buildRowDeltas = (
  rows: ResultRows,
  previousRows: ResultRows,
  dimensionColumns: string[],
  aggregateColumns: string[],
): Array<Record<string, number | null>> => {
  const keyOf = (row: Record<string, unknown>) => JSON.stringify(dimensionColumns.map((column) => row[column] ?? null));
  const previousByKey = new Map(previousRows.map((row) => [keyOf(row), row]));
  return rows.map((row) => {
    const previous = previousByKey.get(keyOf(row));
    return Object.fromEntries(
      aggregateColumns.map((column) => [
        column,
        previous ? getDeltaRatio(toNumber(row[column]), toNumber(previous[column])) : null,
      ]),
    );
  });
};

/** The column's figure from the result's only row, against the compared window's when there is one. */
export const buildSingleValueFigure = (
  rows: ResultRows,
  column: string,
  previousRows?: ResultRows,
): SingleValueFigure => {
  const value = toNumber(rows[0]?.[column]);
  const previous = previousRows ? toNumber(previousRows[0]?.[column]) : null;
  return { value, previous, deltaRatio: getDeltaRatio(value, previous) };
};

/** A date-time column against a value column, in time order: what a time series and a heatmap draw. */
export const toTimedValues = (rows: ResultRows, timeColumn: string, valueColumn: string): TimedValue[] =>
  rows
    .map((row) => ({ bucketMs: toTimeMs(row[timeColumn]), value: toNumber(row[valueColumn]) }))
    .filter((point): point is TimedValue => point.bucketMs != null)
    .sort((a, b) => a.bucketMs - b.bucketMs);

const HOUR_MS = 60 * 60 * 1000;

/** The width of one bucket, read off the closest two: a query names its bucket, not its width. */
export const getBucketWidthMs = (points: TimedValue[]): number => {
  const gaps = points
    .slice(1)
    .map((point, index) => point.bucketMs - points[index].bucketMs)
    .filter((gap) => gap > 0);
  return gaps.length ? Math.min(...gaps) : HOUR_MS;
};

export interface ShareFigure {
  slices: DonutSliceView[];
  total: number;
}

/**
 * The largest values by name, the rest summed into one grey slice, labelled the way the usage dashboard's
 * share legend is: the figure and its share of the total.
 */
export const buildShareFigure = (
  colors: ChartColors,
  rows: ResultRows,
  dimensionColumn: string,
  valueColumn: string,
  otherLabel: string,
  formatValue: (value: number) => string = formatChartNumber,
  emptyLabel = '',
): ShareFigure => {
  const ranked = rows
    .map((row) => ({ name: renderCell(row[dimensionColumn]) || emptyLabel, value: toNumber(row[valueColumn]) ?? 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = ranked.reduce((sum, entry) => sum + entry.value, 0);

  const shown = ranked.slice(0, SHARE_SLICE_COUNT).map((entry) => ({ ...entry, isOther: false }));
  const rest = ranked.slice(SHARE_SLICE_COUNT).reduce((sum, entry) => sum + entry.value, 0);
  const entries = rest > 0 ? [...shown, { name: otherLabel, value: rest, isOther: true }] : shown;

  return {
    total,
    slices: entries.map((entry, index) => ({
      id: entry.isOther ? '__other' : entry.name,
      label: entry.name,
      value: entry.value,
      isOther: entry.isOther,
      valueLabel: formatValue(entry.value),
      shareLabel: total ? formatPercent(entry.value / total, 0) : null,
      color: getSliceColor(colors, index, entry.isOther),
    })),
  };
};

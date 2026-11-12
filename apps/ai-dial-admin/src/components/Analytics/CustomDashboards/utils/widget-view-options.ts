import { TimedValue } from '@/src/components/Analytics/Usage/models';
import { getDeltaRatio } from '@/src/components/Analytics/Usage/utils/format';

type ResultRows = Array<Record<string, unknown>>;

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

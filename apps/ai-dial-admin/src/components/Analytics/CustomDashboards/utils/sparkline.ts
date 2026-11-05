import { QueryExprType, QuerySortDirection, QueryValueType, StructuredQuery } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

type ResultRows = Array<Record<string, unknown>>;

// The alias the bucket column is read back under; a saved query has no reason to use it.
export const SPARKLINE_BUCKET = '__sparkline_bucket';

const DAY_MS = 24 * 60 * 60 * 1000;

// Hourly up to a week keeps a sparkline under 170 points; anything longer is drawn by day.
const HOURLY_UP_TO_MS = 7 * DAY_MS;

export enum SparklineUnit {
  Hour = 'hour',
  Day = 'day',
}

export const getSparklineUnit = (range: TimeRange): SparklineUnit =>
  range.endDate.getTime() - range.startDate.getTime() <= HOURLY_UP_TO_MS ? SparklineUnit.Hour : SparklineUnit.Day;

/**
 * The single-value query split into time buckets: its own aggregates, grouped by a `date_trunc` of the time
 * field, in time order. Everything else — the filter, the time bound — is the query's own.
 */
export const buildSparklineQuery = (
  query: StructuredQuery,
  timeField: string,
  unit: SparklineUnit,
): StructuredQuery => ({
  ...query,
  select: [
    {
      expr: {
        type: QueryExprType.Fn,
        name: 'date_trunc',
        args: [
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: unit },
          { type: QueryExprType.Field, name: timeField },
        ],
      },
      as: SPARKLINE_BUCKET,
    },
    ...(query.select ?? []),
  ],
  group_by: [SPARKLINE_BUCKET],
  sort: [{ field: SPARKLINE_BUCKET, dir: QuerySortDirection.Asc }],
});

/** The column's values in the order the query sorted the buckets; a missing figure reads as zero. */
export const toSparklinePoints = (rows: ResultRows, column: string): number[] =>
  rows.map((row) => {
    const value = Number(row[column]);
    return Number.isFinite(value) ? value : 0;
  });

import { describe, expect, test } from 'vitest';

import {
  buildSparklineQuery,
  getSparklineUnit,
  SPARKLINE_BUCKET,
  SparklineUnit,
  toSparklinePoints,
} from '@/src/components/Analytics/CustomDashboards/utils/sparkline';
import { QueryExprType, QueryMode, QuerySortDirection, StructuredQuery } from '@/src/models/analytics/query';

const DAY_MS = 24 * 60 * 60 * 1000;
const START = new Date('2026-10-01T00:00:00Z');

describe('getSparklineUnit', () => {
  test('draws up to a week by hour and anything longer by day', () => {
    expect(getSparklineUnit({ startDate: START, endDate: new Date(START.getTime() + 7 * DAY_MS) })).toBe(
      SparklineUnit.Hour,
    );
    expect(getSparklineUnit({ startDate: START, endDate: new Date(START.getTime() + 8 * DAY_MS) })).toBe(
      SparklineUnit.Day,
    );
  });
});

describe('buildSparklineQuery', () => {
  test('groups the query by a time bucket in front of its own aggregates, in time order', () => {
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [{ expr: { type: QueryExprType.Fn, name: 'count', args: [] }, as: 'calls' }],
    };
    const bucketed = buildSparklineQuery(query, 'request_time', SparklineUnit.Hour);

    expect(bucketed.select?.[0]).toEqual(
      expect.objectContaining({ as: SPARKLINE_BUCKET, expr: expect.objectContaining({ name: 'date_trunc' }) }),
    );
    expect(bucketed.select?.[1]).toEqual(query.select?.[0]);
    expect(bucketed.group_by).toEqual([SPARKLINE_BUCKET]);
    expect(bucketed.sort).toEqual([{ field: SPARKLINE_BUCKET, dir: QuerySortDirection.Asc }]);
  });
});

describe('toSparklinePoints', () => {
  test('reads the column in row order and a missing figure as zero', () => {
    expect(toSparklinePoints([{ calls: 3 }, { calls: null }, { calls: '5' }], 'calls')).toEqual([3, 0, 5]);
  });
});

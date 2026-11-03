import { describe, expect, test } from 'vitest';

import {
  getFittingViews,
  isComparingView,
  resolveWidgetView,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-views';
import { WidgetView } from '@/src/models/analytics/dashboard';
import { QueryMode } from '@/src/models/analytics/query';
import {
  ExecutedQueryMeta,
  QueryRequestKind,
  QueryResultView,
  ResultValueClass,
} from '@/src/models/analytics/query-builder';
import { SavedQuery } from '@/src/models/analytics/saved-query';

const meta = (patch: Partial<ExecutedQueryMeta>): ExecutedQueryMeta => ({
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Aggregate,
  dimensionColumns: [],
  aggregateColumns: ['calls'],
  columnLabels: {},
  columnValueClasses: {},
  ...patch,
});

const BASE = [WidgetView.Query, WidgetView.Table];
const ONE_ROW = [{}];

describe('getFittingViews', () => {
  test('offers a single value for one row without dimensions', () => {
    expect(getFittingViews(meta({}), ONE_ROW, false)).toEqual([...BASE, WidgetView.SingleValue]);
  });

  test('does not offer a single value for several rows', () => {
    expect(getFittingViews(meta({}), [{}, {}, {}], false)).toEqual(BASE);
  });

  test('offers a time series and a heatmap over one date-time dimension', () => {
    const timed = meta({ dimensionColumns: ['bucket'], columnValueClasses: { bucket: ResultValueClass.DateTime } });
    expect(getFittingViews(timed, ONE_ROW, false)).toEqual([...BASE, WidgetView.TimeSeries, WidgetView.Heatmap]);
  });

  test('treats a computed column of ISO instants as date-time', () => {
    const bucketed = meta({ dimensionColumns: ['hour'] });
    const rows = [{ hour: '2026-10-27T12:00:00Z' }, { hour: '2026-10-27T13:00:00Z' }];
    expect(getFittingViews(bucketed, rows, false)).toEqual([...BASE, WidgetView.TimeSeries, WidgetView.Heatmap]);
  });

  test('offers a share over one text dimension', () => {
    expect(getFittingViews(meta({ dimensionColumns: ['model'] }), [{ model: 'gpt' }], false)).toEqual([
      ...BASE,
      WidgetView.Share,
    ]);
  });

  test('offers only the base views for two dimensions, no aggregates, or composite SQL', () => {
    expect(getFittingViews(meta({ dimensionColumns: ['model', 'project'] }), ONE_ROW, false)).toEqual(BASE);
    expect(getFittingViews(meta({ aggregateColumns: [] }), ONE_ROW, false)).toEqual(BASE);
    expect(getFittingViews(meta({}), ONE_ROW, true)).toEqual(BASE);
  });
});

describe('resolveWidgetView', () => {
  test('keeps a stored view that fits', () => {
    expect(resolveWidgetView(WidgetView.Share, [...BASE, WidgetView.Share])).toBe(WidgetView.Share);
  });

  test("falls back to the query's own view when the stored one no longer fits or is absent", () => {
    expect(resolveWidgetView(WidgetView.TimeSeries, BASE)).toBe(WidgetView.Query);
    expect(resolveWidgetView(undefined, BASE)).toBe(WidgetView.Query);
  });
});

describe('isComparingView', () => {
  const TABLE_QUERY = { result_view: QueryResultView.Table } as SavedQuery;
  const CHART_QUERY = { result_view: QueryResultView.Chart } as SavedQuery;

  test('compares a single value, a time series and a table', () => {
    expect(isComparingView(WidgetView.SingleValue, CHART_QUERY)).toBe(true);
    expect(isComparingView(WidgetView.TimeSeries, CHART_QUERY)).toBe(true);
    expect(isComparingView(WidgetView.Table, CHART_QUERY)).toBe(true);
  });

  test('compares the query own view only when it is a table', () => {
    expect(isComparingView(undefined, TABLE_QUERY)).toBe(true);
    expect(isComparingView(WidgetView.Query, CHART_QUERY)).toBe(false);
    expect(isComparingView(undefined, null)).toBe(false);
  });

  test('does not compare a donut or a heatmap', () => {
    expect(isComparingView(WidgetView.Share, TABLE_QUERY)).toBe(false);
    expect(isComparingView(WidgetView.Heatmap, TABLE_QUERY)).toBe(false);
  });
});

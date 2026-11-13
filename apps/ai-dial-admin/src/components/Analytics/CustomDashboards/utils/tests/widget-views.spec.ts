import { describe, expect, test } from 'vitest';

import {
  getFittingViews,
  getCategoryColumn,
  getWidgetView,
  hasQueryView,
  isComparingView,
  resolveWidgetView,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-views';
import { DashboardWidget, WidgetQuerySource, WidgetView } from '@/src/models/analytics/dashboard';
import { QueryMode } from '@/src/models/analytics/query';
import {
  ChartType,
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
const AXIS_CHARTS = [WidgetView.BarChart, WidgetView.LineChart];

describe('getFittingViews', () => {
  test('offers a single value for one row without dimensions', () => {
    expect(getFittingViews(meta({}), ONE_ROW, false, true)).toEqual([...BASE, WidgetView.SingleValue]);
  });

  test('does not offer a single value for several rows', () => {
    expect(getFittingViews(meta({}), [{}, {}, {}], false, true)).toEqual(BASE);
  });

  test('offers a time series, a heatmap and the axis charts over one date-time dimension', () => {
    const timed = meta({ dimensionColumns: ['bucket'], columnValueClasses: { bucket: ResultValueClass.DateTime } });
    expect(getFittingViews(timed, ONE_ROW, false, true)).toEqual([
      ...BASE,
      WidgetView.TimeSeries,
      WidgetView.Heatmap,
      ...AXIS_CHARTS,
    ]);
  });

  test('treats a computed column of ISO instants as date-time', () => {
    const bucketed = meta({ dimensionColumns: ['hour'] });
    const rows = [{ hour: '2026-10-27T12:00:00Z' }, { hour: '2026-10-27T13:00:00Z' }];
    expect(getFittingViews(bucketed, rows, false, true)).toEqual([
      ...BASE,
      WidgetView.TimeSeries,
      WidgetView.Heatmap,
      ...AXIS_CHARTS,
    ]);
  });

  test('offers a share and the axis charts over one text dimension', () => {
    expect(getFittingViews(meta({ dimensionColumns: ['model'] }), [{ model: 'gpt' }], false, true)).toEqual([
      ...BASE,
      WidgetView.Share,
      ...AXIS_CHARTS,
    ]);
  });

  test('offers only the axis charts beyond the base views for two dimensions', () => {
    expect(getFittingViews(meta({ dimensionColumns: ['model', 'project'] }), ONE_ROW, false, true)).toEqual([
      ...BASE,
      ...AXIS_CHARTS,
    ]);
  });

  test('offers only the base views without aggregates', () => {
    expect(getFittingViews(meta({ aggregateColumns: [] }), ONE_ROW, false, true)).toEqual(BASE);
  });

  test('offers the pie and the charts of an untranslated SQL result read by its values', () => {
    const untranslated = meta({
      dimensionColumns: ['topic', 'personal', 'out_of_scope'],
      aggregateColumns: ['personal', 'out_of_scope'],
    });
    const rows = [
      { topic: 'travel', personal: 3, out_of_scope: 1 },
      { topic: 'food', personal: 2, out_of_scope: 4 },
    ];
    expect(getFittingViews(untranslated, rows, true, false)).toEqual([
      WidgetView.Table,
      WidgetView.Share,
      ...AXIS_CHARTS,
      WidgetView.ScatterChart,
    ]);
  });

  test("leaves the query's view out when the widget has none to follow", () => {
    expect(getFittingViews(meta({}), [{}, {}], false, false)).toEqual([WidgetView.Table]);
  });
});

describe('getCategoryColumn', () => {
  test('takes the first column that is not a figure', () => {
    expect(getCategoryColumn({ dimensionColumns: ['calls', 'topic'], aggregateColumns: ['calls'] })).toBe('topic');
  });

  test('takes the first dimension when every one is a figure', () => {
    expect(getCategoryColumn({ dimensionColumns: ['calls'], aggregateColumns: ['calls'] })).toBe('calls');
  });
});

describe('hasQueryView', () => {
  const WIDGET = { id: 'w', row_limit: 10, layout: { x: 0, y: 0, w: 6, h: 4 } } as DashboardWidget;

  test('offers the view of a referenced saved query that keeps one', () => {
    expect(hasQueryView({ ...WIDGET, saved_query_id: 'q' }, { name: 'q', result_view: QueryResultView.Chart })).toBe(
      true,
    );
  });

  test('offers none for a saved query without a view, or for an inline query', () => {
    expect(hasQueryView({ ...WIDGET, saved_query_id: 'q' }, { name: 'q' })).toBe(false);
    expect(hasQueryView(WIDGET, { name: 'sql', sql: 'SELECT 1', result_view: QueryResultView.Table })).toBe(false);
    expect(hasQueryView({ ...WIDGET, saved_query_id: 'q' }, null)).toBe(false);
  });
});

describe('getWidgetView', () => {
  const WIDGET = { id: 'w', row_limit: 10, layout: { x: 0, y: 0, w: 6, h: 4 } } as DashboardWidget;

  test('reads a chart kept in the settings before the stored view', () => {
    expect(getWidgetView({ ...WIDGET, settings: { chart: { type: ChartType.Line } } })).toBe(WidgetView.LineChart);
  });

  test('reads the stored view otherwise', () => {
    expect(getWidgetView({ ...WIDGET, view: WidgetView.Share })).toBe(WidgetView.Share);
    expect(getWidgetView(WIDGET)).toBeUndefined();
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

  test("falls back to the inline query's own chart, then to the table, without a query's view", () => {
    const fitting = [WidgetView.Table, ...AXIS_CHARTS];
    const chartSource = { name: 'sql', result_view: QueryResultView.Chart, chart: { type: ChartType.Bar } };
    expect(resolveWidgetView(undefined, fitting, chartSource as WidgetQuerySource)).toBe(WidgetView.BarChart);
    expect(resolveWidgetView(undefined, fitting, { name: 'sql', result_view: QueryResultView.Table })).toBe(
      WidgetView.Table,
    );
    expect(resolveWidgetView(WidgetView.Heatmap, [WidgetView.Table])).toBe(WidgetView.Table);
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

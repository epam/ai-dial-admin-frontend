import { render, screen } from '@testing-library/react';
import ReactECharts from 'echarts-for-react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import WidgetResult from '@/src/components/Analytics/CustomDashboards/Widget/WidgetResult';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { WidgetQuerySource, WidgetView } from '@/src/models/analytics/dashboard';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, ExecutedQueryMeta, QueryRequestKind, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryChart } from '@/src/models/analytics/saved-query';

const META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Aggregate,
  dimensionColumns: ['week'],
  aggregateColumns: ['fresh', 'returning'],
  columnLabels: {},
  columnValueClasses: {},
};

const RESULT = {
  rows: [
    { week: '2026-10-05', fresh: 4, returning: 10 },
    { week: '2026-10-12', fresh: 6, returning: 12 },
  ],
};

const PIE_LAYOUT = { sliceCount: 5, legendRowsPerColumn: 6, donutSize: 200 };

const WEEK = { startDate: new Date('2026-10-12T00:00:00Z'), endDate: new Date('2026-10-19T00:00:00Z') };

const sourceWithChart = (chart: SavedQueryChart): WidgetQuerySource => ({
  name: 'Users per week',
  sql: 'SELECT 1',
  result_view: QueryResultView.Chart,
  chart,
});

const renderResult = (chart: SavedQueryChart) =>
  render(
    <WidgetResult
      savedQuery={sourceWithChart(chart)}
      result={RESULT}
      meta={META}
      view={WidgetView.Query}
      previousResult={null}
      compare={ComparePeriod.Off}
      heatmapWeek={WEEK}
      isRiseGood
      pieLayout={PIE_LAYOUT}
    />,
  );

const drawnSeriesNames = () =>
  vi.mocked(ReactECharts).mock.lastCall?.[0].option.series.map((series: { name: string }) => series.name);

describe('WidgetResult — query chart', () => {
  beforeEach(() => {
    vi.mocked(ReactECharts).mockClear();
  });

  test('draws every stored Y column of its chart as a series', () => {
    renderResult({ type: ChartType.Line, x_field: 'week', y_field: ['returning', 'fresh'] });
    expect(screen.getByRole('img', { name: 'Users per week' })).toBeTruthy();
    expect(drawnSeriesNames()).toEqual(['returning', 'fresh']);
  });

  test('draws a chart stored with a single Y column name as one series', () => {
    const legacy = { type: ChartType.Bar, x_field: 'week', y_field: 'fresh' } as unknown as SavedQueryChart;
    renderResult(legacy);
    expect(drawnSeriesNames()).toEqual(['fresh']);
  });
});

describe('WidgetResult — chart view', () => {
  const TABLE_SOURCE: WidgetQuerySource = {
    name: 'Users per week',
    sql: 'SELECT 1',
    result_view: QueryResultView.Table,
  };

  const renderView = (view: WidgetView, savedQuery: WidgetQuerySource = TABLE_SOURCE) =>
    render(
      <WidgetResult
        savedQuery={savedQuery}
        result={RESULT}
        meta={META}
        view={view}
        previousResult={null}
        compare={ComparePeriod.Off}
        heatmapWeek={WEEK}
        isRiseGood
        pieLayout={PIE_LAYOUT}
      />,
    );

  beforeEach(() => {
    vi.mocked(ReactECharts).mockClear();
  });

  test('draws every aggregate as a series of a picked bar or line chart', () => {
    renderView(WidgetView.BarChart);
    expect(screen.getByRole('img', { name: 'Users per week' })).toBeTruthy();
    expect(drawnSeriesNames()).toEqual(['fresh', 'returning']);
  });

  test("keeps the query's own axes when the picked chart is of its type", () => {
    renderView(
      WidgetView.LineChart,
      sourceWithChart({ type: ChartType.Line, x_field: 'week', y_field: ['returning'] }),
    );
    expect(drawnSeriesNames()).toEqual(['returning']);
  });

  test('puts the first column that is not a figure on X for an untranslated SQL result', () => {
    render(
      <WidgetResult
        savedQuery={TABLE_SOURCE}
        result={{
          rows: [
            { calls: 3, topic: 'travel' },
            { calls: 5, topic: 'food' },
          ],
        }}
        meta={{
          ...META,
          kind: QueryRequestKind.Sql,
          dimensionColumns: ['calls', 'topic'],
          aggregateColumns: ['calls'],
        }}
        view={WidgetView.BarChart}
        previousResult={null}
        compare={ComparePeriod.Off}
        heatmapWeek={WEEK}
        isRiseGood
        pieLayout={PIE_LAYOUT}
      />,
    );
    expect(drawnSeriesNames()).toEqual(['calls']);
  });
});

describe('WidgetResult — pie', () => {
  const PIE_META: ExecutedQueryMeta = { ...META, dimensionColumns: ['model'], aggregateColumns: ['calls'] };
  const PIE_RESULT = {
    rows: Array.from({ length: 12 }, (_, index) => ({ model: `m${index}`, calls: 12 - index })),
  };

  const renderPie = (
    view: WidgetView,
    pieSliceCount: number,
    savedQuery = sourceWithChart({ type: ChartType.Pie, x_field: 'model', y_field: ['calls'] }),
  ) =>
    render(
      <WidgetResult
        savedQuery={savedQuery}
        result={PIE_RESULT}
        meta={PIE_META}
        view={view}
        previousResult={null}
        compare={ComparePeriod.Off}
        heatmapWeek={WEEK}
        isRiseGood
        pieLayout={{ sliceCount: pieSliceCount, legendRowsPerColumn: 6, donutSize: 200 }}
      />,
    );

  test('names as many categories as its slice count and folds the rest into Other', () => {
    renderPie(WidgetView.Share, 7);
    expect(screen.getByText('m6')).toBeTruthy();
    expect(screen.queryByText('m7')).toBeNull();
    expect(screen.getByText('QueryBuilder.ChartOtherSlice')).toBeTruthy();
  });

  test("draws a pie query's own view as the same donut, with its total", () => {
    renderPie(WidgetView.Query, 10);
    expect(screen.getByText('m9')).toBeTruthy();
    expect(screen.queryByText('m10')).toBeNull();
    expect(screen.getByText('78')).toBeTruthy();
  });
});

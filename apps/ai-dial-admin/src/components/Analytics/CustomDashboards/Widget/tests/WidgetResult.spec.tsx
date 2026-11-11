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

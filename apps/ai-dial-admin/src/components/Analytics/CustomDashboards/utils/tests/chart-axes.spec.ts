import { describe, expect, test } from 'vitest';

import { resolveChartAxes } from '@/src/components/Analytics/CustomDashboards/utils/chart-axes';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, ExecutedQueryMeta, QueryRequestKind } from '@/src/models/analytics/query-builder';

const meta: ExecutedQueryMeta = {
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Aggregate,
  dimensionColumns: ['deployment'],
  aggregateColumns: ['calls', 'cost'],
  columnLabels: {},
  columnValueClasses: {},
};

const result = { rows: [{ deployment: 'gpt', calls: 3, cost: 1.5 }] };

describe('resolveChartAxes', () => {
  test('keeps the stored axes', () => {
    expect(resolveChartAxes({ type: ChartType.Bar, xField: 'deployment', yField: 'cost' }, result, meta)).toEqual({
      xField: 'deployment',
      yField: 'cost',
    });
  });

  test('re-derives unset axes from the result', () => {
    expect(resolveChartAxes({ type: ChartType.Bar, xField: null, yField: null }, result, meta)).toEqual({
      xField: 'deployment',
      yField: 'calls',
    });
  });

  test('gives a scatter two distinct numeric axes', () => {
    expect(resolveChartAxes({ type: ChartType.Scatter, xField: null, yField: null }, result, meta)).toEqual({
      xField: 'calls',
      yField: 'cost',
    });
  });

  test('leaves an axis unset when the result has no column for it', () => {
    const noMeasures = { ...meta, aggregateColumns: [] };
    expect(resolveChartAxes({ type: ChartType.Bar, xField: null, yField: null }, result, noMeasures).yField).toBeNull();
  });
});

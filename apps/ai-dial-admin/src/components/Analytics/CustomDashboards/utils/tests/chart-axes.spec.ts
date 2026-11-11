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
    expect(resolveChartAxes({ type: ChartType.Bar, xField: 'deployment', yFields: ['cost'] }, result, meta)).toEqual({
      xField: 'deployment',
      yFields: ['cost'],
    });
  });

  test('re-derives unset axes from the result', () => {
    expect(resolveChartAxes({ type: ChartType.Bar, xField: null, yFields: null }, result, meta)).toEqual({
      xField: 'deployment',
      yFields: ['calls'],
    });
  });

  test('gives a scatter two distinct numeric axes', () => {
    expect(resolveChartAxes({ type: ChartType.Scatter, xField: null, yFields: null }, result, meta)).toEqual({
      xField: 'calls',
      yFields: ['cost'],
    });
  });

  test('leaves an axis unset when the result has no column for it', () => {
    const noMeasures = { ...meta, aggregateColumns: [] };
    expect(resolveChartAxes({ type: ChartType.Bar, xField: null, yFields: null }, result, noMeasures).yFields).toEqual(
      [],
    );
  });

  test('keeps every stored Y column of a bar or line chart, in order', () => {
    const config = { type: ChartType.Line, xField: 'deployment', yFields: ['cost', 'calls'] };
    expect(resolveChartAxes(config, result, meta).yFields).toEqual(['cost', 'calls']);
  });

  test('draws a pie from its first stored Y column only', () => {
    const config = { type: ChartType.Pie, xField: 'deployment', yFields: ['cost', 'calls'] };
    expect(resolveChartAxes(config, result, meta).yFields).toEqual(['cost']);
  });

  test('drops a stored Y column the result does not return', () => {
    const config = { type: ChartType.Bar, xField: 'deployment', yFields: ['gone', 'calls'] };
    expect(resolveChartAxes(config, result, meta).yFields).toEqual(['calls']);
  });
});

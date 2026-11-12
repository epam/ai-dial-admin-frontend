import { describe, expect, test } from 'vitest';

import {
  getAvailableChartTypes,
  getChartNumericColumns,
} from '@/src/components/Analytics/QueryBuilder/utils/chart-types';
import { ChartType } from '@/src/models/analytics/query-builder';

const ROWS = [
  { topic: 'travel', personal: 3, out_of_scope: 1 },
  { topic: 'food', personal: 2, out_of_scope: 4 },
];

describe('getChartNumericColumns', () => {
  test('counts a column listed both as a dimension and an aggregate once', () => {
    const meta = { dimensionColumns: ['topic', 'personal'], aggregateColumns: ['personal', 'out_of_scope'] };
    expect(getChartNumericColumns(ROWS, meta)).toEqual(['personal', 'out_of_scope']);
  });
});

describe('getAvailableChartTypes', () => {
  test('offers every type for a dimension and two numeric aggregates', () => {
    const meta = { dimensionColumns: ['topic'], aggregateColumns: ['personal', 'out_of_scope'] };
    expect(getAvailableChartTypes(ROWS, meta)).toEqual([
      ChartType.Bar,
      ChartType.Line,
      ChartType.Pie,
      ChartType.Scatter,
    ]);
  });

  test('offers the classified columns of an untranslated SQL result, numeric ones as aggregates', () => {
    const meta = {
      dimensionColumns: ['topic', 'personal', 'out_of_scope'],
      aggregateColumns: ['personal', 'out_of_scope'],
    };
    expect(getAvailableChartTypes(ROWS, meta)).toContain(ChartType.Bar);
  });

  test('drops Scatter with fewer than two numeric columns', () => {
    const meta = { dimensionColumns: ['topic'], aggregateColumns: ['personal'] };
    expect(getAvailableChartTypes([{ topic: 'a', personal: 1 }], meta)).toEqual([
      ChartType.Bar,
      ChartType.Line,
      ChartType.Pie,
    ]);
  });

  test('offers no axis chart without a dimension or an aggregate', () => {
    expect(
      getAvailableChartTypes(ROWS, { dimensionColumns: [], aggregateColumns: ['personal', 'out_of_scope'] }),
    ).toEqual([ChartType.Scatter]);
    expect(getAvailableChartTypes([], { dimensionColumns: ['topic'], aggregateColumns: [] })).toEqual([]);
  });
});

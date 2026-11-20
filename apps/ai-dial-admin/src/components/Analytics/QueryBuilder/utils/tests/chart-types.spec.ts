import { describe, expect, test } from 'vitest';

import {
  getAvailableChartTypes,
  getChartNumericColumns,
  getQueryChartTypes,
  getScorecardColumns,
  hasChartSplit,
} from '@/src/components/Analytics/QueryBuilder/utils/chart-types';
import { QueryMode } from '@/src/models/analytics/query';
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

describe('getQueryChartTypes', () => {
  const aggregate = (meta: { dimensionColumns: string[]; aggregateColumns: string[] }) => ({
    ...meta,
    mode: QueryMode.Aggregate,
  });

  test('offers scatter for a result split by a second dimension with one numeric column', () => {
    const rows = [{ activity: 'coding', sentiment: 'positive', n: 2 }];
    const meta = aggregate({ dimensionColumns: ['activity', 'sentiment'], aggregateColumns: ['n'] });

    expect(getQueryChartTypes([...rows, ...rows], meta)).toContain(ChartType.Scatter);
  });

  test('does not split an untranslated SQL run', () => {
    const meta = { dimensionColumns: ['a', 'b'], aggregateColumns: ['n'], mode: QueryMode.Row };

    expect(hasChartSplit(meta)).toBe(false);
  });

  test('offers the scorecard for a single row with a numeric column, and only then', () => {
    const meta = aggregate({ dimensionColumns: [], aggregateColumns: ['cost'] });

    expect(getQueryChartTypes([{ cost: 12.5 }], meta)).toEqual([ChartType.Scorecard]);
    expect(getQueryChartTypes([{ cost: 1 }, { cost: 2 }], meta)).not.toContain(ChartType.Scorecard);
    expect(getScorecardColumns([{ cost: 'n/a' }], meta)).toEqual([]);
  });

  test('offers only the scorecard for an untranslated one-row run whose columns are all numeric', () => {
    const meta = { dimensionColumns: ['n'], aggregateColumns: ['n'], mode: QueryMode.Row };

    expect(getQueryChartTypes([{ n: 42 }], meta)).toEqual([ChartType.Scorecard]);
  });

  test('keeps the category charts for a one-row result that has a category column', () => {
    const meta = aggregate({ dimensionColumns: ['deployment'], aggregateColumns: ['n'] });

    expect(getQueryChartTypes([{ deployment: 'gpt', n: 42 }], meta)).toEqual([
      ChartType.Bar,
      ChartType.Line,
      ChartType.Pie,
      ChartType.Scorecard,
    ]);
  });
});

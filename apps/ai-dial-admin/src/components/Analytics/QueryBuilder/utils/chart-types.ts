import {
  getNumericColumns,
  getStrictNumericColumns,
} from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, ExecutedQueryMeta } from '@/src/models/analytics/query-builder';

type ResultRows = Array<Record<string, unknown>>;
type ChartColumnsMeta = Pick<ExecutedQueryMeta, 'dimensionColumns' | 'aggregateColumns'>;
type ChartSplitMeta = ChartColumnsMeta & Pick<ExecutedQueryMeta, 'mode'>;

export const getChartNumericColumns = (rows: ResultRows, meta: ChartColumnsMeta): string[] =>
  getNumericColumns(rows, [...new Set([...meta.dimensionColumns, ...meta.aggregateColumns])]);

export const getAvailableChartTypes = (rows: ResultRows, meta: ChartColumnsMeta): ChartType[] => {
  const types: ChartType[] = [];
  if (meta.dimensionColumns.length && meta.aggregateColumns.length) {
    types.push(ChartType.Bar, ChartType.Line, ChartType.Pie);
  }
  if (getChartNumericColumns(rows, meta).length >= 2) types.push(ChartType.Scatter);
  return types;
};

export const hasChartSplit = (meta: ChartSplitMeta): boolean =>
  meta.mode === QueryMode.Aggregate && meta.dimensionColumns.length >= 2 && meta.aggregateColumns.length > 0;

export const getScorecardColumns = (rows: ResultRows, meta: ChartColumnsMeta): string[] =>
  rows.length === 1 ? getStrictNumericColumns(rows, meta.aggregateColumns) : [];

export const getQueryChartTypes = (rows: ResultRows, meta: ChartSplitMeta): ChartType[] => {
  const scorecardColumns = getScorecardColumns(rows, meta);
  const hasCategory = meta.dimensionColumns.some((column) => !scorecardColumns.includes(column));
  if (scorecardColumns.length && !hasCategory) return [ChartType.Scorecard];
  const types = getAvailableChartTypes(rows, meta);
  if (hasChartSplit(meta) && !types.includes(ChartType.Scatter)) types.push(ChartType.Scatter);
  if (scorecardColumns.length) types.push(ChartType.Scorecard);
  return types;
};

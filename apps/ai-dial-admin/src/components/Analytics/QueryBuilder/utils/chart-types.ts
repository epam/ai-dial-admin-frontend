import { getNumericColumns } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { ChartType, ExecutedQueryMeta } from '@/src/models/analytics/query-builder';

type ResultRows = Array<Record<string, unknown>>;
type ChartColumnsMeta = Pick<ExecutedQueryMeta, 'dimensionColumns' | 'aggregateColumns'>;

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

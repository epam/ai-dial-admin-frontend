import { getNumericColumns } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { resolveYFields } from '@/src/components/Analytics/QueryBuilder/utils/chart-fields';
import { CHART_SLOT_DESCRIPTORS } from '@/src/constants/analytics/query-builder';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartColumnSource,
  ChartConfig,
  ExecutedQueryMeta,
  ResolvedChartAxes,
} from '@/src/models/analytics/query-builder';

/**
 * The axes a stored chart configuration draws on, re-deriving an unset one from the result the way the
 * query page does: the slot's first valid column, and for Y the first one not already on X.
 */
export const resolveChartAxes = (
  config: ChartConfig,
  result: StructuredQueryResult,
  meta: ExecutedQueryMeta,
): ResolvedChartAxes => {
  const numericColumns = getNumericColumns(result.rows, [
    ...new Set([...meta.dimensionColumns, ...meta.aggregateColumns]),
  ]);
  const columnsFor = (source: ChartColumnSource): string[] => {
    if (source === ChartColumnSource.Dimensions) return meta.dimensionColumns;
    if (source === ChartColumnSource.Aggregates) return meta.aggregateColumns;
    return numericColumns;
  };

  const descriptor = CHART_SLOT_DESCRIPTORS[config.type];
  const xOptions = columnsFor(descriptor.xSource);
  const yOptions = columnsFor(descriptor.ySource);
  const xField = config.xField ?? xOptions[0] ?? null;
  const yFields = resolveYFields(config.yFields, yOptions, xField, descriptor.isMultiY);
  return { xField, yFields };
};

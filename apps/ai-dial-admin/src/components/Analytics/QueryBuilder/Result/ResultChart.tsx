'use client';

import { FC, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';
import { DialNoDataContent, DialSegmentedControl, DialSelect } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import { buildChartOptions, getNumericColumns } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { CHART_SLOT_DESCRIPTORS, CHART_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { ChartColumnSource, ChartConfig, ChartType, ExecutedQueryMeta } from '@/src/models/analytics/query-builder';

interface Props {
  result: StructuredQueryResult;
  meta: ExecutedQueryMeta;
  config: ChartConfig;
  onChangeConfig: (config: ChartConfig) => void;
}

const ResultChart: FC<Props> = ({ result, meta, config, onChangeConfig }) => {
  const t = useI18n();

  const numericColumns = useMemo(
    () => getNumericColumns(result.rows, [...meta.dimensionColumns, ...meta.aggregateColumns]),
    [result.rows, meta.dimensionColumns, meta.aggregateColumns],
  );

  const columnsFor = (source: ChartColumnSource): string[] => {
    if (source === ChartColumnSource.Dimensions) return meta.dimensionColumns;
    if (source === ChartColumnSource.Aggregates) return meta.aggregateColumns;
    return numericColumns;
  };

  const descriptor = CHART_SLOT_DESCRIPTORS[config.type];
  const xOptions = columnsFor(descriptor.xSource);
  const yOptions = columnsFor(descriptor.ySource);

  // Config fields are null until the user picks — defaults are the slot's first valid column
  // (for Y, the first column not already on X, so a fresh scatter gets two distinct axes).
  const xField = config.xField ?? xOptions[0] ?? null;
  const yField = config.yField ?? yOptions.find((c) => c !== xField) ?? yOptions[0] ?? null;

  // Scatter needs two numeric columns to mean anything — with fewer, the type is hidden entirely.
  const scatterUnavailable = numericColumns.length < 2;

  const typeOptions: SegmentedControlOption<ChartType>[] = CHART_TYPE_OPTIONS.filter(
    (o) => !(o.value === ChartType.Scatter && scatterUnavailable),
  ).map((o) => ({ value: o.value as ChartType, label: o.label }));

  // Switching type keeps a pick that is valid for the new type's slot; an invalid pick falls back
  // to null, which re-derives that slot's default on render.
  const onChangeType = (type: ChartType) => {
    const next = CHART_SLOT_DESCRIPTORS[type];
    const keepIfValid = (field: string | null, options: string[]) => (field && options.includes(field) ? field : null);
    onChangeConfig({
      type,
      xField: keepIfValid(config.xField, columnsFor(next.xSource)),
      yField: keepIfValid(config.yField, columnsFor(next.ySource)),
    });
  };

  const labelFor = (column: string): string => meta.columnLabels[column] ?? column;

  const options = useMemo(
    () =>
      xField && yField
        ? buildChartOptions(config.type, result.rows, xField, yField, {
            dimensionColumns: meta.dimensionColumns,
            otherLabel: t(QueryBuilderI18nKey.ChartOtherSlice),
            columnLabels: meta.columnLabels,
          })
        : null,
    [config.type, result.rows, xField, yField, meta.dimensionColumns, meta.columnLabels, t],
  );

  if (!options) {
    return <DialNoDataContent title={t(QueryBuilderI18nKey.ChartUnavailable)} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DialSegmentedControl
          ariaLabel={t(QueryBuilderI18nKey.ChartTypeSwitcher)}
          options={typeOptions}
          value={config.type}
          onChange={onChangeType}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="w-[200px]">
            <DialSelect
              prefix={`${t(descriptor.xLabelKey)}: `}
              options={xOptions.map((c) => ({ value: c, label: labelFor(c) }))}
              value={xField ?? undefined}
              onChange={(v) => onChangeConfig({ ...config, xField: v as string })}
            />
          </div>
          <div className="w-[200px]">
            <DialSelect
              prefix={`${t(descriptor.yLabelKey)}: `}
              options={yOptions.map((c) => ({ value: c, label: labelFor(c) }))}
              value={yField ?? undefined}
              onChange={(v) => onChangeConfig({ ...config, yField: v as string })}
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ReactECharts option={options} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
    </div>
  );
};

export default ResultChart;

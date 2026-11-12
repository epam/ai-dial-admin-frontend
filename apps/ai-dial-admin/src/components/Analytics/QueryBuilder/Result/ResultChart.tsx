'use client';

import { FC, useMemo } from 'react';

import classNames from 'classnames';
import { NoDataContent, SegmentedControl, Select } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlItem } from '@epam/ai-dial-ui-kit';

import { buildChartOptions } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import SeriesChart from '@/src/components/Analytics/QueryBuilder/Result/SeriesChart';
import { keepValidYFields, resolveYFields } from '@/src/components/Analytics/QueryBuilder/utils/chart-fields';
import {
  getAvailableChartTypes,
  getChartNumericColumns,
} from '@/src/components/Analytics/QueryBuilder/utils/chart-types';
import { CHART_SLOT_DESCRIPTORS, CHART_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useChartColors } from '@/src/hooks/use-chart-colors';
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
  const colors = useChartColors();

  // Deduplicated: a SQL run the backend could not translate offers every column as a dimension, so
  // its numeric columns are in both lists — counting them twice would offer scatter a single column
  // to plot against itself.
  const numericColumns = useMemo(() => getChartNumericColumns(result.rows, meta), [result.rows, meta]);
  const availableTypes = useMemo(() => getAvailableChartTypes(result.rows, meta), [result.rows, meta]);

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
  const yFields = useMemo(
    () => resolveYFields(config.yFields, yOptions, xField, descriptor.isMultiY),
    [config.yFields, yOptions, xField, descriptor.isMultiY],
  );

  const typeOptions: SegmentedControlItem<ChartType>[] = CHART_TYPE_OPTIONS.filter(
    (o) => o.value === config.type || availableTypes.includes(o.value as ChartType),
  ).map((o) => ({ value: o.value as ChartType, label: o.label }));

  // Switching type keeps a pick that is valid for the new type's slot; an invalid pick falls back
  // to null, which re-derives that slot's default on render.
  const onChangeType = (type: ChartType) => {
    const next = CHART_SLOT_DESCRIPTORS[type];
    const keepIfValid = (field: string | null, options: string[]) => (field && options.includes(field) ? field : null);
    onChangeConfig({
      type,
      xField: keepIfValid(config.xField, columnsFor(next.xSource)),
      yFields: keepValidYFields(config.yFields, columnsFor(next.ySource), next.isMultiY),
    });
  };

  const labelFor = (column: string): string => meta.columnLabels[column] ?? column;

  const onChangeYFields = (value: string | string[]) =>
    onChangeConfig({ ...config, yFields: Array.isArray(value) ? value : [value] });

  const options = useMemo(
    () =>
      xField && yFields.length
        ? buildChartOptions(config.type, result.rows, xField, yFields, {
            colors,
            dimensionColumns: meta.dimensionColumns,
            otherLabel: t(QueryBuilderI18nKey.ChartOtherSlice),
            emptyLabel: t(QueryBuilderI18nKey.ChartEmptyCategory),
            columnLabels: meta.columnLabels,
          })
        : null,
    [config.type, result.rows, xField, yFields, meta.dimensionColumns, meta.columnLabels, t, colors],
  );

  if (!xField || !yOptions.length) {
    return <NoDataContent title={t(QueryBuilderI18nKey.ChartNoAxisSelection)} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label={t(QueryBuilderI18nKey.ChartTypeSwitcher)}
          items={typeOptions}
          value={config.type}
          onChange={onChangeType}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="w-[200px]">
            <Select
              prefix={`${t(descriptor.xLabelKey)}: `}
              ariaLabel={t(descriptor.xLabelKey)}
              options={xOptions.map((c) => ({ value: c, label: labelFor(c) }))}
              value={xField ?? undefined}
              onChange={(v) => onChangeConfig({ ...config, xField: v as string })}
            />
          </div>
          <div className={classNames(descriptor.isMultiY ? 'w-[280px]' : 'w-[200px]')}>
            <Select
              prefix={`${t(descriptor.yLabelKey)}: `}
              ariaLabel={t(descriptor.yLabelKey)}
              options={yOptions.map((c) => ({ value: c, label: labelFor(c) }))}
              multiple={descriptor.isMultiY}
              collapseTagOverflow={descriptor.isMultiY}
              value={descriptor.isMultiY ? yFields : yFields[0]}
              onChange={onChangeYFields}
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {options ? (
          <SeriesChart option={options} />
        ) : (
          <NoDataContent title={t(QueryBuilderI18nKey.ChartNoAxisSelection)} />
        )}
      </div>
    </div>
  );
};

export default ResultChart;

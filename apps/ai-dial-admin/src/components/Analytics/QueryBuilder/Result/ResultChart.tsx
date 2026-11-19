'use client';

import { FC, useId, useMemo } from 'react';

import { NoDataContent } from '@epam/ai-dial-ui-kit';

import { useQuerySparkline } from '@/src/components/Analytics/Common/use-query-sparkline';
import ChartFormattingPanel from '@/src/components/Analytics/QueryBuilder/Result/ChartFormattingPanel';
import { buildChartOptions, buildPieOptions } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { ChartSlotView, ScorecardTrendSource } from '@/src/components/Analytics/QueryBuilder/Result/models';
import ResultScorecard from '@/src/components/Analytics/QueryBuilder/Result/ResultScorecard';
import SeriesChart from '@/src/components/Analytics/QueryBuilder/Result/SeriesChart';
import { useChartPanelOpen } from '@/src/components/Analytics/QueryBuilder/Result/use-chart-panel-open';
import {
  keepValidYFields,
  resolveChartSplit,
  resolveYFields,
} from '@/src/components/Analytics/QueryBuilder/utils/chart-fields';
import {
  getChartNumericColumns,
  getQueryChartTypes,
  getScorecardColumns,
  hasChartSplit,
} from '@/src/components/Analytics/QueryBuilder/utils/chart-types';
import { buildShareFigure } from '@/src/components/Analytics/Usage/utils/share-figure';
import { CHART_SLOT_DESCRIPTORS, DEFAULT_CHART_LEGEND, PIE_MAX_SLICES } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useChartColors } from '@/src/hooks/use-chart-colors';
import { useI18n } from '@/src/locales/client';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartColumnSource,
  ChartConfig,
  ChartLegendConfig,
  ChartType,
  ExecutedQueryMeta,
} from '@/src/models/analytics/query-builder';

interface Props {
  result: StructuredQueryResult;
  meta: ExecutedQueryMeta;
  config: ChartConfig;
  onChangeConfig: (config: ChartConfig) => void;
  trendSource?: ScorecardTrendSource;
}

const SPLIT_TYPES = [ChartType.Bar, ChartType.Line, ChartType.Scatter];

const ResultChart: FC<Props> = ({ result, meta, config, onChangeConfig, trendSource }) => {
  const t = useI18n();
  const colors = useChartColors();
  const xSlotId = useId();
  const ySlotId = useId();
  const [isPanelOpen, onTogglePanel] = useChartPanelOpen();

  const rows = result.rows;
  const numericColumns = useMemo(() => getChartNumericColumns(rows, meta), [rows, meta]);
  const scorecardColumns = useMemo(() => getScorecardColumns(rows, meta), [rows, meta]);
  const availableTypes = useMemo(() => getQueryChartTypes(rows, meta), [rows, meta]);
  const isSplitResult = hasChartSplit(meta);

  const columnsFor = (source: ChartColumnSource): string[] => {
    if (source === ChartColumnSource.Dimensions) return meta.dimensionColumns;
    if (source === ChartColumnSource.Aggregates) return meta.aggregateColumns;
    return numericColumns;
  };

  const slotColumns = (type: ChartType): { x: string[]; y: string[] } => {
    if (type === ChartType.Scorecard) return { x: [], y: scorecardColumns };
    if (type === ChartType.Scatter && isSplitResult) return { x: meta.dimensionColumns, y: meta.aggregateColumns };
    const descriptor = CHART_SLOT_DESCRIPTORS[type];
    return { x: columnsFor(descriptor.xSource), y: columnsFor(descriptor.ySource) };
  };

  const descriptor = CHART_SLOT_DESCRIPTORS[config.type];
  const isScorecard = config.type === ChartType.Scorecard;
  const isPie = config.type === ChartType.Pie;
  const { x: xOptions, y: yOptions } = slotColumns(config.type);

  const xField = isScorecard ? null : (config.xField ?? xOptions[0] ?? null);
  const splitField =
    isSplitResult && SPLIT_TYPES.includes(config.type) ? resolveChartSplit(meta.dimensionColumns, xField) : null;
  const isMultiY = descriptor.isMultiY && !splitField;
  const yFields = useMemo(
    () => resolveYFields(config.yFields, yOptions, xField, isMultiY),
    [config.yFields, yOptions, xField, isMultiY],
  );
  const [valueField] = yFields;
  const legend = config.legend ?? DEFAULT_CHART_LEGEND;

  const onChangeType = (type: ChartType) => {
    const next = slotColumns(type);
    const keepIfValid = (field: string | null, options: string[]) => (field && options.includes(field) ? field : null);
    onChangeConfig({
      ...config,
      type,
      xField: keepIfValid(config.xField, next.x),
      yFields: keepValidYFields(config.yFields, next.y, CHART_SLOT_DESCRIPTORS[type].isMultiY),
    });
  };
  const onChangeLegend = (next: ChartLegendConfig) => onChangeConfig({ ...config, legend: next });

  const labelFor = (column: string): string => meta.columnLabels[column] ?? column;
  const toOptions = (columns: string[]) => columns.map((column) => ({ value: column, label: labelFor(column) }));
  const ySlot: ChartSlotView = {
    id: ySlotId,
    label: t(descriptor.yLabelKey),
    options: toOptions(yOptions),
    value: isMultiY ? yFields : yFields[0],
    isMultiple: isMultiY,
    onChange: (value) => onChangeConfig({ ...config, yFields: Array.isArray(value) ? value : [value] }),
  };
  const xSlot: ChartSlotView = {
    id: xSlotId,
    label: t(descriptor.xLabelKey),
    options: toOptions(xOptions),
    value: xField ?? undefined,
    isMultiple: false,
    onChange: (value) => onChangeConfig({ ...config, xField: value as string }),
  };
  const scorecardSlots = scorecardColumns.length > 1 ? [ySlot] : [];
  const slots = isScorecard ? scorecardSlots : [xSlot, ySlot];

  const options = useMemo(() => {
    if (isScorecard || !xField || !valueField) return null;
    if (isPie) {
      const share = buildShareFigure(colors, rows, xField, valueField, {
        otherLabel: t(QueryBuilderI18nKey.ChartOtherSlice),
        sliceCount: PIE_MAX_SLICES,
        emptyLabel: t(QueryBuilderI18nKey.ChartEmptyCategory),
      });
      return buildPieOptions(colors, share.slices);
    }
    return buildChartOptions(config.type, rows, xField, yFields, {
      colors,
      dimensionColumns: meta.dimensionColumns,
      otherLabel: t(QueryBuilderI18nKey.ChartOtherSlice),
      emptyLabel: t(QueryBuilderI18nKey.ChartEmptyCategory),
      columnLabels: meta.columnLabels,
      splitField,
    });
  }, [isScorecard, isPie, xField, valueField, colors, rows, yFields, config.type, meta, splitField, t]);

  const trend = useQuerySparkline({
    query: trendSource?.query ?? null,
    timeField: trendSource?.timeField ?? null,
    column: valueField ?? '',
    range: trendSource?.range ?? { startDate: new Date(0), endDate: new Date(0) },
    isEnabled: isScorecard && !!trendSource,
  });

  const renderFigure = () => {
    if (isScorecard && valueField) {
      return <ResultScorecard label={labelFor(valueField)} value={rows[0]?.[valueField]} points={trend} />;
    }
    if (options) return <SeriesChart option={options} legendConfig={legend} />;
    return <NoDataContent title={t(QueryBuilderI18nKey.ChartNoAxisSelection)} />;
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded border border-tertiary">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">{renderFigure()}</div>
      <ChartFormattingPanel
        isOpen={isPanelOpen}
        onToggle={onTogglePanel}
        type={config.type}
        types={availableTypes}
        onChangeType={onChangeType}
        slots={slots}
        legend={isScorecard ? undefined : legend}
        onChangeLegend={onChangeLegend}
      />
    </div>
  );
};

export default ResultChart;

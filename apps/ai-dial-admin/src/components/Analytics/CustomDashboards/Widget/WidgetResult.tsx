'use client';

import { FC, useCallback, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';
import { ColDef } from 'ag-grid-community';

import { ROW_DELTAS_FIELD } from '@/src/components/Analytics/CustomDashboards/constants';
import { resolveChartAxes } from '@/src/components/Analytics/CustomDashboards/utils/chart-axes';
import { getWidgetTableColumns } from '@/src/components/Analytics/CustomDashboards/utils/widget-table';
import { getCategoryColumn } from '@/src/components/Analytics/CustomDashboards/utils/widget-views';
import {
  buildRowDeltas,
  buildShareFigure,
  getBucketWidthMs,
  toTimedValues,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-view-options';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { formatCardFigure, formatFullFigure } from '@/src/components/Analytics/CustomDashboards/utils/value-format';
import BreakdownGrid from '@/src/components/Analytics/Usage/Breakdown/BreakdownGrid';
import MeasureCell, { MeasureCellParams } from '@/src/components/Analytics/Usage/Breakdown/cells/MeasureCell';
import DonutFigure from '@/src/components/Analytics/Usage/Charts/DonutFigure';
import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import HeatmapWeekGrid, { formatHeatmapDayLabel } from '@/src/components/Analytics/Usage/Charts/HeatmapWeekGrid';
import { DONUT_SIZE } from '@/src/components/Analytics/Usage/constants';
import { buildValueTimeSeriesOptions, formatChartNumber } from '@/src/components/Analytics/Usage/utils/chart-options';
import { formatBucketLabel, formatBucketRange } from '@/src/components/Analytics/Usage/utils/format';
import { buildValueHeatmapMatrix } from '@/src/components/Analytics/Usage/utils/heatmap';
import { COMPARE_NAME_KEY } from '@/src/components/Analytics/Usage/utils/labels';
import { buildChartOptions } from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import SeriesChart from '@/src/components/Analytics/QueryBuilder/Result/SeriesChart';
import { readChartYFields } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import {
  exactNumberText,
  formatResultValue,
  getValueClassColumn,
} from '@/src/components/Analytics/QueryBuilder/Result/result-column-format';
import ResultValueCell from '@/src/components/Analytics/QueryBuilder/Result/ResultValueCell';
import GridView from '@/src/components/Grid/GridView/GridView';
import { CHART_TYPE_BY_WIDGET_VIEW } from '@/src/constants/analytics/dashboards';
import { CHART_SLOT_DESCRIPTORS } from '@/src/constants/analytics/query-builder';
import { CustomDashboardsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useChartColors } from '@/src/hooks/use-chart-colors';
import { useI18n } from '@/src/locales/client';
import { WidgetQuerySource, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartColumnSource,
  ChartConfig,
  ChartType,
  ExecutedQueryMeta,
  QueryResultView,
} from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';

interface Props {
  savedQuery: WidgetQuerySource;
  result: StructuredQueryResult;
  meta: ExecutedQueryMeta;
  // Already resolved against the result: a view handed here fits it.
  view: WidgetView;
  previousResult: StructuredQueryResult | null;
  compare: ComparePeriod;
  // The calendar week an Activity heatmap draws: the one holding the range's end.
  heatmapWeek: TimeRange;
  valueFormat?: WidgetValueFormat;
  currency?: string;
  // Colours a table figure's change; Single value widgets take theirs from the same setting.
  isRiseGood: boolean;
}

const COMPARED_COLUMN_MIN_WIDTH = 200;

// A result row carrying its changes against the compared window, keyed by aggregate column.
type ComparedRow = Record<string, unknown> & { id: string; [ROW_DELTAS_FIELD]?: Record<string, number | null> };

const toChartConfig = (savedQuery: WidgetQuerySource, view: WidgetView, meta: ExecutedQueryMeta): ChartConfig => {
  const type = CHART_TYPE_BY_WIDGET_VIEW[view] ?? savedQuery.chart?.type ?? ChartType.Bar;
  if (view === WidgetView.Query || savedQuery.chart?.type === type) {
    return { type, xField: savedQuery.chart?.x_field ?? null, yFields: readChartYFields(savedQuery.chart?.y_field) };
  }
  const descriptor = CHART_SLOT_DESCRIPTORS[type];
  if (descriptor.xSource !== ChartColumnSource.Dimensions) return { type, xField: null, yFields: null };
  const xField = getCategoryColumn(meta) ?? null;
  const yFields = descriptor.isMultiY ? meta.aggregateColumns.filter((column) => column !== xField) : null;
  return { type, xField, yFields };
};

/**
 * A result in the widget's view, read-only: the editor's view toggle and chart pickers are absent. The query's
 * own view follows the saved query's table or chart; a chart view draws every aggregate it can as a series,
 * the usage views read the first dimension and first aggregate.
 */
const WidgetResult: FC<Props> = ({
  savedQuery,
  result,
  meta,
  view,
  previousResult,
  compare,
  heatmapWeek,
  valueFormat,
  currency,
  isRiseGood,
}) => {
  const t = useI18n();
  const colors = useChartColors();
  const isChart =
    (view === WidgetView.Query && savedQuery.result_view === QueryResultView.Chart) ||
    !!CHART_TYPE_BY_WIDGET_VIEW[view];
  const [dimension] = meta.dimensionColumns;
  const [aggregate] = meta.aggregateColumns;
  const categoryColumn = getCategoryColumn(meta);

  // A table compares as the usage breakdown does: each figure carries its change against the matching row.
  const isTableCompared = !!previousResult && !isChart && view !== WidgetView.SingleValue;
  // The figure each compared column shows, keyed by column; it also sizes the column's ruler below.
  const figureFormats = useMemo(() => {
    const formats: Record<string, (row: ComparedRow) => string> = {};
    if (!isTableCompared) return formats;
    for (const field of meta.aggregateColumns) {
      formats[field] = (row) => formatResultValue(row[field], meta.columnValueClasses[field]);
    }
    return formats;
  }, [isTableCompared, meta.aggregateColumns, meta.columnValueClasses]);

  const columns = useMemo(
    () =>
      getWidgetTableColumns(result, meta.columnLabels).map((col): ColDef => {
        const field = col.field ?? '';
        const format = figureFormats[field];
        const base = { ...col, ...getValueClassColumn(meta.columnValueClasses[field]) };
        if (!format) return { ...base, cellRenderer: ResultValueCell };
        // The exact figure moves into the cell's own tooltip, as in the usage breakdown, so the grid's is off.
        return {
          ...base,
          // The breakdown grid publishes each column's rulers under its colId.
          colId: field,
          // Room for a figure beside a badge as wide as `2,486.3%`; past it the grid scrolls sideways.
          minWidth: COMPARED_COLUMN_MIN_WIDTH,
          tooltipValueGetter: undefined,
          cellRenderer: MeasureCell,
          cellRendererParams: {
            isRiseGood,
            getDelta: (row: ComparedRow) => row[ROW_DELTAS_FIELD]?.[field],
            format,
            formatExact: (row: ComparedRow) => {
              const exact = exactNumberText(row[field]);
              return exact === format(row) ? null : exact;
            },
          } satisfies MeasureCellParams<ComparedRow>,
        };
      }),
    [result, meta.columnLabels, meta.columnValueClasses, figureFormats, isRiseGood],
  );

  const tableRows = useMemo(() => {
    if (!isTableCompared || !previousResult) return result.rows;
    const deltas = buildRowDeltas(result.rows, previousResult.rows, meta.dimensionColumns, meta.aggregateColumns);
    // The breakdown grid keys its rows by id; a result row's position is stable for one result.
    return result.rows.map((row, index) => ({ ...row, id: String(index), [ROW_DELTAS_FIELD]: deltas[index] }));
  }, [isTableCompared, previousResult, result.rows, meta.dimensionColumns, meta.aggregateColumns]);

  const chartOptions = useMemo(() => {
    if (!isChart) return null;
    const config = toChartConfig(savedQuery, view, meta);
    const { xField, yFields } = resolveChartAxes(config, result, meta);
    if (!xField || !yFields.length) return null;
    return buildChartOptions(config.type, result.rows, xField, yFields, {
      colors,
      dimensionColumns: meta.dimensionColumns,
      otherLabel: t(QueryBuilderI18nKey.ChartOtherSlice),
      emptyLabel: t(QueryBuilderI18nKey.ChartEmptyCategory),
      columnLabels: meta.columnLabels,
    });
  }, [isChart, savedQuery, view, result, meta, colors, t]);

  const timeSeriesOptions = useMemo(() => {
    if (view !== WidgetView.TimeSeries) return null;
    const points = toTimedValues(result.rows, dimension, aggregate);
    const previous = previousResult ? toTimedValues(previousResult.rows, dimension, aggregate) : null;
    const widthMs = getBucketWidthMs(points);
    return buildValueTimeSeriesOptions(
      colors,
      points,
      formatBucketLabel,
      points.map((point) => formatBucketRange(point.bucketMs, widthMs)),
      // Aligned bucket by bucket, since the compared window's timestamps lie in another window. A lone line
      // needs no name, as on the usage dashboard.
      previous
        ? {
            currentLabel: t(CustomDashboardsI18nKey.CurrentPeriod),
            label: t(COMPARE_NAME_KEY[compare]),
            values: points.map((_, index) => previous[index]?.value ?? null),
          }
        : undefined,
    );
  }, [view, colors, result.rows, previousResult, dimension, aggregate, compare, t]);

  const heatmap = useMemo(
    () =>
      view === WidgetView.Heatmap
        ? buildValueHeatmapMatrix(toTimedValues(result.rows, dimension, aggregate), heatmapWeek, formatHeatmapDayLabel)
        : null,
    [view, result.rows, dimension, aggregate, heatmapWeek],
  );

  const readHeatmapCell = useCallback(
    (day: string, hour: string, value: number) =>
      t(CustomDashboardsI18nKey.HeatmapCellLabel, { day, hour, value: formatChartNumber(value) }),
    [t],
  );

  const share = useMemo(
    () =>
      view === WidgetView.Share
        ? buildShareFigure(
            colors,
            result.rows,
            categoryColumn,
            aggregate,
            t(QueryBuilderI18nKey.ChartOtherSlice),
            (value) => formatFullFigure(value, valueFormat, currency),
            t(QueryBuilderI18nKey.ChartEmptyCategory),
          )
        : null,
    [view, colors, result.rows, categoryColumn, aggregate, valueFormat, currency, t],
  );

  if (!result.rows.length) {
    return <UsageEmptyState title={t(CustomDashboardsI18nKey.WidgetEmpty)} className="size-full" />;
  }

  if (share) {
    // The usage dashboard's own donut: the total in the ring, each slice's figure and share in the legend.
    const total = formatCardFigure(share.total, valueFormat, currency);
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-auto">
        <DonutFigure
          slices={share.slices}
          centerValue={`${total.value}${total.unit ?? ''}`}
          centerCaption={meta.columnLabels[aggregate] ?? aggregate}
          size={DONUT_SIZE}
          // A wide widget would stretch the legend until a name and its figure sit a screen apart.
          legendClassName="max-w-[360px]"
        />
      </div>
    );
  }

  if (heatmap) {
    // The usage dashboard's own week grid, its scale under it.
    return <HeatmapWeekGrid matrix={heatmap} isLoading={false} readCellLabel={readHeatmapCell} />;
  }

  if (timeSeriesOptions) {
    return (
      <div role="img" aria-label={savedQuery.name} className="size-full min-h-0">
        <ReactECharts
          option={timeSeriesOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge
        />
      </div>
    );
  }

  if (isChart) {
    // The canvas carries no semantics of its own, so the chart is named the way the usage dashboard's are.
    return chartOptions ? (
      <SeriesChart option={chartOptions} ariaLabel={savedQuery.name} />
    ) : (
      <UsageEmptyState title={t(CustomDashboardsI18nKey.ChartUnavailable)} className="size-full" />
    );
  }

  if (isTableCompared) {
    // The usage breakdown's own grid, which lines the figures and badges up by each column's widest figure.
    return (
      <BreakdownGrid<ComparedRow>
        rows={tableRows as ComparedRow[]}
        columnDefs={columns}
        isLoading={false}
        hasFailed={false}
        className="size-full"
      />
    );
  }

  return <GridView columnDefs={columns} rowData={tableRows} />;
};

export default WidgetResult;

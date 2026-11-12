import { getAvailableChartTypes } from '@/src/components/Analytics/QueryBuilder/utils/chart-types';
import { WIDGET_VIEW_BY_CHART_TYPE } from '@/src/constants/analytics/dashboards';
import { DashboardWidget, WidgetQuerySource, WidgetView } from '@/src/models/analytics/dashboard';
import { ChartType, ExecutedQueryMeta, QueryResultView, ResultValueClass } from '@/src/models/analytics/query-builder';

// The views that draw the compared window; every other view shows only the current one.
const COMPARING_VIEWS: WidgetView[] = [WidgetView.SingleValue, WidgetView.TimeSeries, WidgetView.Table];

/**
 * Whether a widget draws the compared window: a figure's change, a second line, or a change beside each table
 * figure as the usage breakdown shows it. The query's own view compares only when it is a table, since a
 * chart with a second window doubles its marks without a clear reading.
 */
export const isComparingView = (
  view: WidgetView | undefined,
  savedQuery: WidgetQuerySource | null | undefined,
): boolean => {
  if (view == null || view === WidgetView.Query)
    return !!savedQuery && savedQuery.result_view !== QueryResultView.Chart;
  return COMPARING_VIEWS.includes(view);
};

type ResultRows = Array<Record<string, unknown>>;

// An ISO-8601 instant, as the service answers a timestamp computed by a function such as `date_trunc`.
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// A schema field carries its date-time class; a computed column has none, so its values decide.
const isDateTime = (meta: ExecutedQueryMeta, rows: ResultRows, column: string): boolean => {
  if (meta.columnValueClasses[column] === ResultValueClass.DateTime) return true;
  const values = rows.map((row) => row[column]).filter((value) => value != null);
  return values.length > 0 && values.every((value) => typeof value === 'string' && ISO_INSTANT.test(value));
};

export const getCategoryColumn = (meta: Pick<ExecutedQueryMeta, 'dimensionColumns' | 'aggregateColumns'>) =>
  meta.dimensionColumns.find((column) => !meta.aggregateColumns.includes(column)) ?? meta.dimensionColumns[0];

/**
 * The usage dashboard's views a result fits. Every column of a composite SQL result counts as a dimension and
 * its numeric ones as aggregates too, so of these views only the pie, which needs one category and one figure, reads it.
 */
const getUsageViews = (meta: ExecutedQueryMeta, rows: ResultRows, isComposite: boolean): WidgetView[] => {
  if (!meta.aggregateColumns.length) return [];
  if (isComposite) {
    const hasCategory = meta.dimensionColumns.some((column) => !meta.aggregateColumns.includes(column));
    return hasCategory ? [WidgetView.Share] : [];
  }
  const [dimension, ...otherDimensions] = meta.dimensionColumns;
  if (!dimension) return rows.length === 1 ? [WidgetView.SingleValue] : [];
  if (otherDimensions.length) return [];
  return isDateTime(meta, rows, dimension) ? [WidgetView.TimeSeries, WidgetView.Heatmap] : [WidgetView.Share];
};

export const getFittingViews = (
  meta: ExecutedQueryMeta,
  rows: ResultRows,
  isComposite: boolean,
  hasQueryView: boolean,
): WidgetView[] => [
  ...(hasQueryView ? [WidgetView.Query] : []),
  WidgetView.Table,
  ...getUsageViews(meta, rows, isComposite),
  ...getAvailableChartTypes(rows, meta)
    .filter((type) => type !== ChartType.Pie)
    .map((type) => WIDGET_VIEW_BY_CHART_TYPE[type]),
];

export const hasQueryView = (widget: DashboardWidget, source: WidgetQuerySource | null | undefined): boolean =>
  !!widget.saved_query_id && source?.result_view != null;

export const getWidgetView = (widget: DashboardWidget): WidgetView | undefined => {
  const chartType = widget.settings?.chart?.type;
  return chartType ? WIDGET_VIEW_BY_CHART_TYPE[chartType] : widget.view;
};

const getSourceChartView = (source: WidgetQuerySource | null | undefined): WidgetView | undefined =>
  source?.result_view === QueryResultView.Chart && source.chart?.type
    ? WIDGET_VIEW_BY_CHART_TYPE[source.chart.type]
    : undefined;

export const resolveWidgetView = (
  stored: WidgetView | undefined,
  fitting: WidgetView[],
  source?: WidgetQuerySource | null,
): WidgetView => {
  if (stored && fitting.includes(stored)) return stored;
  if (fitting.includes(WidgetView.Query)) return WidgetView.Query;
  const sourceChartView = getSourceChartView(source);
  return sourceChartView && fitting.includes(sourceChartView) ? sourceChartView : WidgetView.Table;
};

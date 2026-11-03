import { WidgetQuerySource, WidgetView } from '@/src/models/analytics/dashboard';
import { ExecutedQueryMeta, QueryResultView, ResultValueClass } from '@/src/models/analytics/query-builder';

// Every widget can show these, whatever its result.
const ALWAYS_FITTING = [WidgetView.Query, WidgetView.Table];

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

/**
 * The views a widget's latest result fits, judged from the executed query's dimension and aggregate columns
 * — the classification the query page offers its chart axes from. Composite SQL keeps to the views that
 * need no reading of its columns, since every column of an untranslated result counts as a dimension.
 */
export const getFittingViews = (meta: ExecutedQueryMeta, rows: ResultRows, isComposite: boolean): WidgetView[] => {
  if (isComposite || !meta.aggregateColumns.length) return ALWAYS_FITTING;

  const views = [...ALWAYS_FITTING];
  const [dimension, ...otherDimensions] = meta.dimensionColumns;

  if (!dimension) {
    if (rows.length === 1) views.push(WidgetView.SingleValue);
    return views;
  }
  if (otherDimensions.length) return views;

  if (isDateTime(meta, rows, dimension)) {
    views.push(WidgetView.TimeSeries, WidgetView.Heatmap);
  } else {
    views.push(WidgetView.Share);
  }
  return views;
};

/** The view a widget draws: its stored one while the result fits it, otherwise the query's own. */
export const resolveWidgetView = (stored: WidgetView | undefined, fitting: WidgetView[]): WidgetView =>
  stored && fitting.includes(stored) ? stored : WidgetView.Query;

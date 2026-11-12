import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { StructuredQuery } from '@/src/models/analytics/query';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryChart, SavedQueryTime } from '@/src/models/analytics/saved-query';

// A position on the dashboard grid, in grid units: `x`/`w` in columns, `y`/`h` in rows.
export interface WidgetPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}

// The grid engine's placement of one item, keyed by the widget id.
export interface GridItemPlacement extends WidgetPlacement {
  i: string;
}

// A query held by the widget itself: SQL typed into Add widget, or a personal saved query copied when its
// dashboard was made public. It follows no saved query.
export interface WidgetInlineQuery {
  name: string;
  query?: StructuredQuery;
  sql?: string;
  result_view: QueryResultView;
  chart?: SavedQueryChart;
}

// A widget exists only inside its dashboard and is written with it. Exactly one of `saved_query_id` and
// `inline_query` is set; a reference reads the query's result view and chart configuration each time.
export interface DashboardWidget {
  id: string;
  saved_query_id?: string;
  inline_query?: WidgetInlineQuery;
  title?: string;
  // What the widget shows and why, under its title.
  description?: string;
  // Always an explicit integer: the form that fills it owns the default, so no reader has to know it.
  row_limit: number;
  // Absent means the query's own view; a stored view that no longer fits the result falls back to it.
  view?: WidgetView;
  // The aggregate a Single value widget shows; absent means the result's first one.
  value_column?: string;
  // Which way a Single value's change is good news; absent means higher is better.
  change_direction?: ChangeDirection;
  settings?: DashboardWidgetSettings;
  layout: WidgetPlacement;
}

export interface DashboardWidgetSettings {
  // How a Single value or Share figure is written; absent means a plain number.
  value_format?: WidgetValueFormat;
  // The ISO 4217 code a money figure is written in; absent means US dollars.
  currency?: string;
  chart?: WidgetChartSettings;
  [key: string]: unknown;
}

export interface WidgetChartSettings {
  type: ChartType;
}

export type DashboardSettings = Record<string, unknown>;

export enum DashboardVisibility {
  // Seen and written by its owner only.
  Private = 'private',
  // Seen by everyone with Analytics; written, like a common saved query, by a caller who may publish.
  Public = 'public',
}

// What the service lets the caller do to one dashboard.
export interface DashboardPermissions {
  write: boolean;
  publish: boolean;
}

// What the service lets the caller create.
export interface DashboardCreatePermissions {
  create_private: boolean;
  create_public: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  visibility: DashboardVisibility;
  // Set by the service from the creating caller; absent when authentication is disabled.
  owner_id?: string;
  owner_email?: string;
  time?: SavedQueryTime;
  // Absent compares nothing, like `ComparePeriod.Off`.
  compare?: ComparePeriod;
  settings?: DashboardSettings;
  widgets: DashboardWidget[];
  generation: number;
  created_at: string;
  updated_at: string;
  permissions: DashboardPermissions;
}

export interface DashboardListItem {
  id: string;
  name: string;
  description?: string;
  visibility: DashboardVisibility;
  updated_at: string;
  permissions: DashboardPermissions;
}

export interface DashboardList {
  dashboards: DashboardListItem[];
  permissions: DashboardCreatePermissions;
}

// The write payload: everything a caller supplies, for a create and a whole-dashboard replace alike.
export interface DashboardRequest {
  name: string;
  description?: string;
  visibility: DashboardVisibility;
  time?: SavedQueryTime;
  compare?: ComparePeriod;
  settings?: DashboardSettings;
  widgets: DashboardWidget[];
}

export enum WidgetSize {
  ExtraSmall = 'extra-small',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

// How a widget draws its result. `Query` is its saved query's own table or chart.
export enum WidgetView {
  Query = 'query',
  Table = 'table',
  SingleValue = 'single_value',
  TimeSeries = 'time_series',
  Share = 'share',
  Heatmap = 'heatmap',
  BarChart = 'bar_chart',
  LineChart = 'line_chart',
  ScatterChart = 'scatter_chart',
}

export enum WidgetValueFormat {
  Number = 'number',
  Money = 'money',
  // The figure is already a percentage (74.3 reads 74.3%), as a query computing `* 100` returns it.
  Percent = 'percent',
  // Milliseconds, written as ms or s like the usage dashboard's latency.
  Duration = 'duration',
}

export enum ChangeDirection {
  HigherIsBetter = 'higher_is_better',
  LowerIsBetter = 'lower_is_better',
}

export enum WidgetMoveDirection {
  Up = 'up',
  Down = 'down',
}

export enum WidgetQueryKind {
  // A DSL body, or SQL that translates to one: takes the dashboard range and the row limit.
  Structured = 'structured',
  // SQL with no single-query form (join, subquery, derived table): runs as written.
  CompositeSql = 'composite-sql',
  // The saved query is missing or cannot be read by the caller.
  Unavailable = 'unavailable',
  // Resolving the query failed for any other reason; it may succeed if tried again.
  Failed = 'failed',
}

// What a widget's query is rendered from: a saved query, or an inline query, which has no id or scope.
export interface WidgetQuerySource extends Pick<SavedQuery, 'name' | 'query' | 'sql' | 'result_view' | 'chart'> {
  id?: string;
  scope?: SavedQuery['scope'];
}

export interface StructuredWidgetQuery {
  kind: WidgetQueryKind.Structured;
  savedQuery: WidgetQuerySource;
  query: StructuredQuery;
  fields: AnalyticsEntityField[];
}

export interface CompositeSqlWidgetQuery {
  kind: WidgetQueryKind.CompositeSql;
  savedQuery: WidgetQuerySource;
  sql: string;
}

export interface UnavailableWidgetQuery {
  kind: WidgetQueryKind.Unavailable;
}

export interface FailedWidgetQuery {
  kind: WidgetQueryKind.Failed;
}

export type WidgetQuery = StructuredWidgetQuery | CompositeSqlWidgetQuery | UnavailableWidgetQuery | FailedWidgetQuery;

// A dashboard as its page receives it: the stored dashboard plus every widget's query, resolved once per
// load and keyed by `getWidgetQueryKey`, so two widgets on one saved query share one resolution.
export interface ResolvedDashboard {
  dashboard: Dashboard;
  queries: Record<string, WidgetQuery>;
}

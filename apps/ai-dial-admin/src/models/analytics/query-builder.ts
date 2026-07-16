import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import {
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

// The toolbar time filter serializes into the structured query as ge/le predicates on this field —
// resolved once per build so the JSON view, Copy, and Run all carry the same visible time bound.
export interface QueryTimeBound {
  field: string;
  range: TimeRange;
}

export enum FilterNodeKind {
  Group = 'group',
  Predicate = 'predicate',
}

export interface FilterPredicateNode {
  id: string;
  kind: FilterNodeKind.Predicate;
  field: string;
  op: QueryOperator;
  valueType: QueryValueType;
  value: string;
  isNull: boolean;
}

export interface FilterGroupNode {
  id: string;
  kind: FilterNodeKind.Group;
  op: QueryLogicalOperator;
  children: FilterNode[];
}

export type FilterNode = FilterGroupNode | FilterPredicateNode;

// One ordered argument value of a function row. Exactly one member is populated per the catalog
// argument's kind: `field` for an `expression` argument, `literal` for a literal argument.
export interface FnArgValue {
  field?: string;
  literal?: string;
}

// One Group by entry: a plain column (fn = null) or a scalar-function expression. When fn is a
// catalog function name, `args` holds one value slot per that function's catalog argument (in
// order) and `field` is unused; when fn is null the row is a plain column named by `field`.
export interface GroupByRow {
  id: string;
  fn: string | null;
  field: string;
  alias: string;
  args: FnArgValue[];
}

// One aggregate metric: a catalog function (aggregate / ordered_set_aggregate group) with one arg
// value slot per catalog argument, an optional distinct flag, and an alias.
export interface AggregateRow {
  id: string;
  fn: string;
  distinct: boolean;
  alias: string;
  args: FnArgValue[];
}

export interface SortRow {
  id: string;
  field: string;
  dir: QuerySortDirection;
  nulls: QuerySortNulls;
}

export interface PageState {
  enabled: boolean;
  type: QueryPageType;
  offset: number;
  limit: number;
  includeTotal: boolean;
  cursor: string;
  cursorLimit: number;
}

export interface QueryBuilderState {
  entityName: string;
  fields: AnalyticsEntityField[];
  // The served function catalog (GET /v1/queries/functions); empty when the fetch failed. Sole
  // source of the builder's function set — preserved across entity/mode/state resets.
  functions: QueryFunction[];
  mode: QueryMode;
  distinct: boolean;
  filter: FilterGroupNode;
  select: string[];
  groupBy: GroupByRow[];
  aggregates: AggregateRow[];
  having: FilterGroupNode;
  sort: SortRow[];
  page: PageState;
}

export interface FieldOption {
  name: string;
  type?: string;
  tag?: string;
  display_name?: string;
  description?: string;
  sensitive?: boolean;
}

export interface FieldOptionGroup {
  tag: string;
  options: FieldOption[];
}

// A function entry offered by the categorized dropdown alongside columns; `name` is the catalog
// function name and `hint` is its catalog description shown next to the name.
export interface FunctionOption {
  name: string;
  hint: string;
}

export enum QueryBuilderView {
  Form = 'form',
  Json = 'json',
  Sql = 'sql',
}

// A query run request. Structured (Form/JSON views) posts a StructuredQuery to /execute; SQL posts
// the editor text to /execute-sql. Discriminated so the result sidebar can branch the transport
// while sharing all result rendering.
export enum QueryRequestKind {
  Structured = 'structured',
  Sql = 'sql',
}

export type QueryRunRequest =
  | { kind: QueryRequestKind.Structured; query: StructuredQuery }
  | { kind: QueryRequestKind.Sql; sql: string };

export enum QueryBuilderWarning {
  MissingAggregateAlias = 'MissingAggregateAlias',
  MissingGroupByField = 'MissingGroupByField',
  MissingGroupByAlias = 'MissingGroupByAlias',
  EmptyAggregate = 'EmptyAggregate',
}

// The builder's own color language, mirroring how the same query reads in the Monaco JSON view:
// fields/keys are teal, values blue, grouping brackets purple, keywords yellow, numbers orange.
export enum QueryBuilderColor {
  Dimension = 'dimension',
  Measure = 'measure',
  Grouping = 'grouping',
  Constraint = 'constraint',
  Keyword = 'keyword',
  Numeric = 'numeric',
}

export interface QueryBuilderColorClasses {
  marker: string;
  text: string;
  chipBg: string;
  chipText: string;
  borderAccent: string;
}

export enum QueryResultView {
  Table = 'table',
  Chart = 'chart',
}

export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Scatter = 'scatter',
}

export interface ChartConfig {
  type: ChartType;
  xField: string | null;
  yField: string | null;
}

// Where a chart slot draws its column options from. Numeric means "any result column whose every
// value is numeric or date-like" — detected from the rows, since aggregates can be non-numeric
// (min/max over text) and group-bys can be numeric (length(), numeric codes).
export enum ChartColumnSource {
  Dimensions = 'dimensions',
  Aggregates = 'aggregates',
  Numeric = 'numeric',
}

// Per-chart-type contract for the two column selectors: where each slot's options come from and how
// the selector is labeled (X axis / Y axis vs Category / Value). ChartConfig stays shape-stable
// across types; only this descriptor varies.
export interface ChartSlotDescriptor {
  xSource: ChartColumnSource;
  ySource: ChartColumnSource;
  xLabelKey: QueryBuilderI18nKey;
  yLabelKey: QueryBuilderI18nKey;
}

// Result-derived context buildChartOptions needs beyond the two slot fields: pie localizes its
// "Other" bucket, scatter labels points by the row's dimension values, and axis titles/tooltips
// show columns by their display label (see ExecutedQueryMeta.columnLabels).
export interface ChartBuildContext {
  dimensionColumns: string[];
  otherLabel: string;
  columnLabels: Record<string, string>;
}

export interface PieSlice {
  name: string;
  value: number;
}

// Snapshot of the query a result came from. Chart availability and the X/Y option lists must follow
// what was actually executed — the live builder state can diverge from the shown result between runs.
// columnLabels maps result columns to their schema display names (group-by columns of the executed
// entity); columns without an entry (aggregate aliases, scalar-fn aliases) display as themselves.
export interface ExecutedQueryMeta {
  kind: QueryRequestKind;
  mode: QueryMode;
  dimensionColumns: string[];
  aggregateColumns: string[];
  columnLabels: Record<string, string>;
}

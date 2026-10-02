import { QueryFilterNode } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

export enum UsageView {
  Llm = 'llm',
  Mcp = 'mcp',
  Routes = 'routes',
}

export enum ComparePeriod {
  Off = 'off',
  PreviousPeriod = 'previous-period',
  PreviousMonth = 'previous-month',
  PreviousYear = 'previous-year',
}

/** Which measure the share chart splits the window by. */
export enum DonutMetric {
  Calls = 'calls',
  Cost = 'cost',
}

export enum BreakdownTab {
  Models = 'models',
  Applications = 'applications',
  Projects = 'projects',
  McpServers = 'mcp-servers',
  Tools = 'tools',
  Owners = 'owners',
  Paths = 'paths',
  Callers = 'callers',
}

/** Which of the two route mechanisms a Routes view row was served by. */
export enum RouteKind {
  Application = 'application',
  Global = 'global',
}

export enum HeatmapMetric {
  Calls = 'calls',
  Cost = 'cost',
}

export enum KpiMetric {
  TotalSpend = 'total-spend',
  Requests = 'requests',
  Tokens = 'tokens',
  CostPerMillionTokens = 'cost-per-million-tokens',
  UniqueCallers = 'unique-callers',
  ErrorRate = 'error-rate',
  AvgLatency = 'avg-latency',
}

/**
 * Which rows a block reads beyond its view and window. `own` is the entity's own rows — calls made
 * to it; `made` is the calls it made, where a figure reads those instead. The page has neither.
 */
export interface UsageScope {
  own: QueryFilterNode[];
  made?: QueryFilterNode[];
}

/** Which column a request sums spend from. */
export enum SpendColumn {
  /** The price of the row's own call. */
  Deployment = 'deployment_price',
  /** The price of the row's call together with every call it set off. */
  Total = 'total_price',
}

/** The rows one request reads beyond its view and window, and the column its spend is summed from. */
export interface RowScope {
  entityClauses: QueryFilterNode[];
  spendColumn: SpendColumn;
}

/** Where a block reads each of its figures from. The page reads every row, as an empty scope. */
export interface BlockReads {
  /** Read every figure from the calls the entity made, rather than from the calls made to it. */
  isMadeOnly?: boolean;
  /** Tabs ranked from the calls the entity made. */
  madeTabs?: BreakdownTab[];
  /** Tokens and cost per 1M come from the calls the entity made, with a caption saying so. */
  hasMadeTokens?: boolean;
  /** The column spend on the entity's own rows is summed from. */
  ownSpendColumn?: SpendColumn;
}

/** One block of an entity dashboard; `ENTITY_BLOCKS` says why a tab is hidden. */
export interface EntityBlock extends BlockReads {
  view: UsageView;
  hiddenTab: BreakdownTab;
  /** Rendered only for an entity that declares routes. */
  isRoutesOnly?: boolean;
}

export interface RequestState<T> {
  data: T | null;
  isLoading: boolean;
  hasFailed: boolean;
}

/** Measures over the current window and the one it is compared against. */
export interface ComparedMeasures {
  current: UsageMeasures | null;
  previous: UsageMeasures | null;
}

/** The requests behind a `ComparedMeasures`. */
export interface ComparedTotals {
  current: RequestState<UsageMeasures | null>;
  previous: RequestState<UsageMeasures | null>;
}

export interface ComparedWindows {
  current: TimeRange;
  previous?: TimeRange;
}

export interface WindowedValue {
  current: number | null;
  previous: number | null;
}

/** Every figure one aggregate row carries. Absent where the view does not report it. */
export interface UsageMeasures {
  calls: number;
  callers: number;
  failed: number;
  avgLatencyMs: number | null;
  spend: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  /** Only the bucketed request carries these; every other aggregate leaves them null. */
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
}

export interface BucketPoint {
  bucketMs: number;
  measures: UsageMeasures;
}

export enum TimeSeriesView {
  Requests = 'requests',
  ByDimension = 'by-dimension',
  Cost = 'cost',
  Latency = 'latency',
}

export interface SpendBucket {
  bucketMs: number;
  spend: number;
}

export interface DimensionBucketPoint {
  bucketMs: number;
  seriesId: string;
  calls: number;
}

export interface BreakdownRow {
  id: string;
  label: string;
  isFallbackLabel: boolean;
  measures: UsageMeasures;
  /** Deployments this row aggregates, capped; set only where its dimension does not name them. */
  groupNames?: string[];
  /** How many there are altogether, which a capped list cannot say. */
  groupCount?: number | null;
  /** The values of the tab's qualifier columns, in their order; set only on a qualified tab. */
  qualifiers?: string[];
}

/**
 * One slice as the ring and its legend both read it. The colour is carried rather than derived from
 * a position, so a filtered legend still matches the ring it describes.
 */
export interface DonutSliceView {
  id: string;
  label: string;
  value: number;
  isOther: boolean;
  /** The figure of the measure the ring is split by. */
  valueLabel: string;
  /**
   * The other measure, stated beside it where there is room for both. The dialog fills these; the
   * card leaves them out and states `valueLabel` alone.
   */
  callsLabel?: string;
  costLabel?: string;
  shareLabel: string | null;
  color: string;
}

export interface KpiFigure {
  metric: KpiMetric;
  value: WindowedValue;
  sparkline: number[];
}

export interface KpiCardModel {
  metric: KpiMetric;
  titleKey: string;
  value: string | null;
  unit?: string;
  deltaRatio: number | null;
  /** The previous window held nothing and this one does: a change with nothing to divide by. */
  isNew: boolean;
  footnote?: string;
  /** What the figure counts, where the title alone would overstate it. */
  caption?: string;
  sparkline: number[];
}

/**
 * How each of a row's measures moved against the previous window, as a ratio of its own previous
 * value. Null where there is nothing to divide by: no comparison, or a previous value of zero.
 */
export interface BreakdownDeltas {
  calls: number | null;
  errorRate: number | null;
  avgLatencyMs: number | null;
  spend: number | null;
}

export interface BreakdownRowModel {
  id: string;
  displayLabel: string;
  isFallbackLabel: boolean;
  fallbackTooltip?: string;
  /** What the row's own name leaves out — which MCP server a tool was called on. */
  subLabel?: string;
  subLabelTooltip?: string;
  calls: number;
  /** Kept beside the rate: a rate rounded for the column cannot be read back into a count. */
  failed: number;
  share: number | null;
  deltas: BreakdownDeltas;
  isNewRow: boolean;
  errorRate: number | null;
  avgLatencyMs: number | null;
  /** Null in the MCP view, where a row carries no price at all. */
  spend: number | null;
  /** Set only on the Routes view's tabs that state a row's kind. */
  routeKind?: RouteKind;
}

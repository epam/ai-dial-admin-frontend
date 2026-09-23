import { TimeRange } from '@/src/models/time-range';

export enum UsageView {
  Llm = 'llm',
  Mcp = 'mcp',
}

export enum ComparePeriod {
  Off = 'off',
  PreviousPeriod = 'previous-period',
}

export enum BreakdownTab {
  Models = 'models',
  Applications = 'applications',
  Projects = 'projects',
  McpServers = 'mcp-servers',
  Tools = 'tools',
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
  ToolCalls = 'tool-calls',
}

export interface RequestState<T> {
  data: T | null;
  isLoading: boolean;
  hasFailed: boolean;
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
  toolCalls: number | null;
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
  valueLabel: string;
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
  footnote?: string;
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
}

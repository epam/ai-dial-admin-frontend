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

export enum KpiMetric {
  TotalSpend = 'total-spend',
  Requests = 'requests',
  Tokens = 'tokens',
  CostPerMillionTokens = 'cost-per-million-tokens',
  UniqueUsers = 'unique-users',
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
  users: number;
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

export enum SpendScaleUnit {
  Day = 'day',
  Month = 'month',
}

export interface SpendScale {
  unit: SpendScaleUnit;
  count: number;
}

export interface SpendPeriod {
  startMs: number;
  endMs: number;
  spend: number;
  isCurrent: boolean;
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

export interface BreakdownRowModel {
  id: string;
  displayLabel: string;
  isFallbackLabel: boolean;
  fallbackTooltip?: string;
  calls: number;
  share: number | null;
  deltaRatio: number | null;
  isNewRow: boolean;
  errorRate: number | null;
  avgLatencyMs: number | null;
}

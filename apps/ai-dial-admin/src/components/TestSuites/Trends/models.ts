export interface TrendsRunPoint {
  runId: string;
  runName: string;
  computedAtMs: number;
  overallScore: number | null;
  durationMs: number | null;
  isFailed: boolean;
  metricNames?: string[];
}

/**
 * Per-run test-case threshold outcome counts for the Test Cases stacked-bar card.
 * `errorOrNa` includes non-SUCCESS execution and SUCCESS with null `passed`.
 */
export interface RunTestCaseSegments {
  runId: string;
  runName: string;
  above: number;
  below: number;
  errorOrNa: number;
  total: number;
}

/** Window-level KPI fields shared across the Trends tab (strip cards derive their own metrics). */
export interface TrendsKpiData {
  runCount: number;
}

export interface MetricTrendSeries {
  name: string;
  color: string;
  /** Per-run values aligned with `runOrder` (null when missing for that run). */
  values: (number | null)[];
}

export interface MetricTrendGroup {
  name: string;
  series: MetricTrendSeries[];
}

export interface TrendsData {
  runOrder: TrendsRunPoint[];
  kpis: TrendsKpiData;
  statistics: string[];
  byStatistic: Record<string, MetricTrendGroup[]>;
}

/** Dark/light Metric Trends tag palette entry (stroke + fills). */
export interface TrendTagPaletteEntry {
  stroke: string;
  fill: string;
  hover: string;
}

/** Gauge slice for the Latest Run semicircle chart. */
export interface LatestRunGaugeSlice {
  name: string;
  value: number;
  color: string;
}

/**
 * Per-run source + metrics values for Cost / Runtime combo charts.
 * Null segment means missing (gap); total for the line is the sum of present segments.
 */
export interface ComboTrendPoint {
  runId: string;
  runName: string;
  /** Run timestamp for the combo tooltip header (Figma 12410:284939). */
  computedAtMs: number;
  /** Blue bar — target (Application/Model/…) cost or runtime. */
  source: number | null;
  /** Violet bar — metrics cost or metrics runtime. */
  metrics: number | null;
}

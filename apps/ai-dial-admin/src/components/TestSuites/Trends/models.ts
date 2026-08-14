export interface TrendsRunPoint {
  runId: string;
  runName: string;
  computedAtMs: number;
  overallScore: number | null;
  durationMs: number | null;
  isFailed: boolean;
}

export interface TrendsKpiData {
  runCount: number;
  latestOverallScore: number | null;
  avgRunTimeMs: number | null;
  scoreMin: number | null;
  scoreMax: number | null;
  latestScore: number | null;
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

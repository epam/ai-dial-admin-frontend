import { PassFailErrorCounts } from '@/src/components/Common/PassFailStatus/models';

export interface TrendsRunPoint {
  runId: string;
  runName: string;
  computedAtMs: number;
  overallScore: number | null;
  durationMs: number | null;
  isFailed: boolean;
}

/** Pass/fail/error counts for runs vs suite overallScoreThreshold in the Trends window. */
export type TrendsThresholdStats = PassFailErrorCounts;

export interface TrendsKpiData {
  runCount: number;
  latestOverallScore: number | null;
  avgRunTimeMs: number | null;
  scoreMin: number | null;
  scoreMax: number | null;
  latestScore: number | null;
  /** Null when the suite has no overallScoreThreshold — card is hidden. */
  thresholdStats: TrendsThresholdStats | null;
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

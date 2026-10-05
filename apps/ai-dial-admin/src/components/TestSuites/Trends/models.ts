import { PassFailErrorCounts } from '@/src/components/Common/PassFailStatus/models';
import { RunStatus } from '@/src/models/evaluation/run';

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

/** Stack order of a Cases Passed bar, bottom-up. */
export enum CasePassRateSegmentKind {
  Passed = 'passed',
  Failed = 'failed',
  Errored = 'errored',
  NotScored = 'notScored',
}

export interface CasePassRateSegment {
  kind: CasePassRateSegmentKind;
  /** Share of the bar's `totalCount`, 0-100. */
  percent: number;
}

/** One run's bar in the Cases Passed panel. */
export interface CasePassRateBar {
  runId: string;
  /** Run name when known, otherwise a short run-id prefix. */
  label: string;
  /** From the joined run; null when the run is not in the suite's runs list. */
  createdAtMs: number | null;
  /** From the joined run; undefined when the run is not in the suite's runs list. */
  status: RunStatus | undefined;
  passedCount: number;
  /** SUCCESS rows that did not clear the suite threshold. */
  failedCount: number;
  /** Rows whose execution did not succeed. */
  erroredCount: number;
  /** SUCCESS rows with no threshold evaluation result. */
  notScoredCount: number;
  totalCount: number;
  /** `totalCount` minus the four groups — rows the run has not evaluated yet. */
  notRunCount: number;
  /** Non-zero groups only, in stack order bottom-up. */
  segments: CasePassRateSegment[];
  /** Run detail page, or null when the run has no reachable detail page. */
  href: string | null;
}

/** Cases Passed bars, oldest first. */
export type CasePassRateSeries = CasePassRateBar[];

export interface CasePassRateLatestDetail {
  bar: CasePassRateBar;
  /** Passed-count change against the previous run; null when the window has one run. */
  passedDelta: number | null;
  /**
   * The run produced no pass/fail verdict at all, only unscored rows — so a pass rate would be
   * meaningless rather than zero. Read from the run's own counts, not from the suite's
   * `overallScoreThreshold`: a threshold can be configured and still yield nothing to score.
   * Execution errors do not bear on it.
   */
  isLackingScoring: boolean;
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
  /** `null` when the case-pass-rate response was unusable; empty when the suite has no runs. */
  casePassRate: CasePassRateSeries | null;
  statistics: string[];
  byStatistic: Record<string, MetricTrendGroup[]>;
}

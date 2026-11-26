import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/evaluation/structured-query';

export enum CoverageKind {
  Evaluatees = 'evaluatees',
  Models = 'models',
  Applications = 'applications',
  Toolsets = 'toolsets',
}

export enum CoverageStatus {
  Loading = 'loading',
  Error = 'error',
  Ready = 'ready',
}

/** One data source of the page: its load state, and its value once ready. */
export interface CoverageSource<T> {
  status: CoverageStatus;
  value?: T;
}

/**
 * Ids of the evaluatees a run in the coverage window targeted, whichever ref carried them: a suite that
 * reaches an application through an MCP tool covers it as much as one that calls it directly.
 */
export type CoveredIds = Set<string>;

/** The listed deployment ids of each evaluatee kind. */
export interface ListedDeploymentIds {
  models: string[];
  applications: string[];
  toolsets: string[];
}

/** The deployment listing and the coverage query: every card needs both. */
export interface CoverageSources {
  deployments: CoverageSource<ListedDeploymentIds>;
  covered: CoverageSource<CoveredIds>;
}

export interface CoverageCardModel {
  kind: CoverageKind;
  status: CoverageStatus;
  total: number;
  covered: number;
  uncovered: number;
  /** Covered divided by total as a 0–1 fraction; `null` while not ready or when the total is zero. */
  rate: number | null;
}

export enum ActivityKind {
  SuitesRun = 'suitesRun',
  SuitesAdded = 'suitesAdded',
}

/** A span of local time in epoch milliseconds, both ends inclusive. */
export interface ActivityPeriod {
  fromMs: number;
  toMs: number;
}

export interface ActivityWindows {
  current: ActivityPeriod;
  previous: ActivityPeriod;
}

/** The structured queries behind the activity cards, by what each one reads. */
export interface ActivityQueries {
  totalSuites: StructuredQuery;
  suitesRunCurrent: StructuredQuery;
  suitesRunPrevious: StructuredQuery;
  suitesAddedCurrent: StructuredQuery;
  suitesAddedPrevious: StructuredQuery;
}

/** The result of each activity query; `null` for a query that failed. */
export type ActivityResults = Record<keyof ActivityQueries, StructuredQueryResult | null>;

export interface ActivityCardModel {
  kind: ActivityKind;
  status: CoverageStatus;
  /** The count over the current period. */
  value: number;
  /** `value` minus the same count over the previous period; `null` while not ready. */
  delta: number | null;
  /** Test suites run only: the number of existing test suites. */
  total: number | null;
  /** Test suites run only: `value` divided by `total` as a 0–1 fraction; `null` when the total is zero. */
  rate: number | null;
  /** Test suites added only: the number of distinct evaluatees the added suites target. */
  evaluateeCount: number | null;
}

export interface EvalCostCardModel {
  status: CoverageStatus;
  /** Cost of all evaluation traffic in the current period; `null` while not ready or when none was recorded. */
  total: number | null;
  /** The part of `total` spent running test cases against the evaluatees. */
  evaluateesCost: number | null;
  /** The part of `total` spent on the judge calls that score the answers. */
  judgesCost: number | null;
  /** Signed difference against the previous period (`+$342`); `null` when there is none to show. */
  deltaLabel: string | null;
}

/** One row of the run-trends table, flattened from a suite so the cells render it without further logic. */
export interface RunTrendRow {
  suiteId: string;
  suiteName: string;
  /** The evaluatee's name, else its id; `null` for a suite with no reference, which the cell shows as a dash. */
  evaluateeName: string | null;
  /** i18n key of the evaluatee's type label; `null` exactly when `evaluateeName` is. */
  kindKey: EvalSystemHealthI18nKey | null;
  /** Pass rates (0–1) of the runs that have one, oldest first. */
  points: number[];
  /** Pass rate of the newest run as a 0–1 fraction; `null` when it has none. */
  latestRate: number | null;
  /** Signed percentage-point change against the previous run (`+10%`); `null` when there is none to show. */
  deltaLabel: string | null;
}

export interface RunTrendsData {
  status: CoverageStatus;
  /** The rows of the loaded page; empty while loading, on error, and for an empty result. */
  rows: RunTrendRow[];
  /** Zero-based index of the page shown or loading. */
  page: number;
  /** Page count as the backend reports it, which can exceed what the rows of a short page suggest. */
  totalPages: number;
  totalElements: number;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  /** Requests the current page again after a failure. */
  retry: () => void;
}

/** One week of the health distribution chart, ready to draw and to state. */
export interface HealthDistributionBar {
  /** Monday 00:00 UTC of the week, in epoch milliseconds. */
  weekStart: number;
  /** The week's start as a short month and day in UTC, such as `Nov 3`. */
  label: string;
  healthyCount: number;
  failingCount: number;
  suiteCount: number;
  /** Healthy suites as a percentage of the week's suites, to one decimal; `null` for a week with no suite. */
  healthyShare: number | null;
  /** `100 - healthyShare`, so the two always add up to 100; `null` exactly when `healthyShare` is. */
  failingShare: number | null;
}

export interface HealthDistributionData {
  status: CoverageStatus;
  /** One bar per week, oldest first; empty until the request is ready. */
  bars: HealthDistributionBar[];
  /** The threshold the backend applied; the requested one until the response is in. */
  threshold: number;
  /** Whether the request is ready and no week has a counted suite. */
  isEmpty: boolean;
  /** Requests the chart again after a failure. */
  retry: () => void;
}

export interface HealthDistributionControlsProps {
  weeks: number;
  /** The applied threshold as a whole percentage, 0 to 100. */
  thresholdPercent: number;
  /** Whether either value differs from its default. */
  isModified: boolean;
  onWeeksChange: (weeks: number) => void;
  onThresholdPercentChange: (thresholdPercent: number) => void;
  onReset: () => void;
}

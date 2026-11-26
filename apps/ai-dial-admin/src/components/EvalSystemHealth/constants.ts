import { ActivityKind, CoverageKind } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType } from '@/src/models/evaluation/run-trend';

/** A run covers its evaluatee when it started within this many days of now. */
export const COVERAGE_WINDOW_DAYS = 30;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Added to the wait for midnight so the day-rollover timer never fires before the day has changed. */
export const DAY_ROLLOVER_BUFFER_MS = 1000;

export const RUN_STARTED_AT_FIELD = 'started_at_ms';
export const RUN_SUITE_ID_FIELD = 'test_suite_id';
export const SUITE_ID_FIELD = 'id';
export const LAST_RUN_ALIAS = 'last_run_ms';

/** Row cap of the coverage aggregate, which holds one row per distinct evaluatee. */
export const COVERAGE_ROW_LIMIT = 10_000;

/** Row cap of the suite-id subquery that drops runs of deleted suites; a truncated list would uncover live suites. */
export const SUITE_IDS_SUBQUERY_LIMIT = 100_000;

export const COVERAGE_KIND_ORDER: CoverageKind[] = [
  CoverageKind.Evaluatees,
  CoverageKind.Models,
  CoverageKind.Applications,
  CoverageKind.Toolsets,
];

export const COVERAGE_KIND_TITLE_KEY: Record<CoverageKind, EvalSystemHealthI18nKey> = {
  [CoverageKind.Evaluatees]: EvalSystemHealthI18nKey.TotalEvaluatees,
  [CoverageKind.Models]: EvalSystemHealthI18nKey.TotalModels,
  [CoverageKind.Applications]: EvalSystemHealthI18nKey.TotalApplications,
  [CoverageKind.Toolsets]: EvalSystemHealthI18nKey.TotalToolsets,
};

export const SUITE_CREATED_AT_FIELD = 'created_at_ms';

/** Row cap of the per-suite group-by that counts the suites with a run in a period. */
export const SUITES_RUN_ROW_LIMIT = 100_000;

/** Row cap of the suites created in a period, read for the evaluatees they target. */
export const SUITES_ADDED_ROW_LIMIT = 10_000;

export const ACTIVITY_KIND_ORDER: ActivityKind[] = [ActivityKind.SuitesRun, ActivityKind.SuitesAdded];

export const ACTIVITY_KIND_TITLE_KEY: Record<ActivityKind, EvalSystemHealthI18nKey> = {
  [ActivityKind.SuitesRun]: EvalSystemHealthI18nKey.SuitesRunThisMonth,
  [ActivityKind.SuitesAdded]: EvalSystemHealthI18nKey.SuitesAddedThisMonth,
};

/** Suites per page of the run-trends table; the backend accepts 1–1000. */
export const RUN_TRENDS_PAGE_SIZE = 10;

/** Runs the backend returns per suite at most (`RUN_TREND_LENGTH`); the bars column's header names it. */
export const RUN_TRENDS_LENGTH = 10;

export const RUN_TREND_KIND_BY_DEPLOYMENT_TYPE: Record<DeploymentType, EvalSystemHealthI18nKey> = {
  [DeploymentType.Model]: EvalSystemHealthI18nKey.RunTrendsKindModel,
  [DeploymentType.Application]: EvalSystemHealthI18nKey.RunTrendsKindApplication,
  [DeploymentType.Toolset]: EvalSystemHealthI18nKey.RunTrendsKindToolset,
};

/** Used when the evaluatee carries no deployment type, or one this table has no label for. */
export const RUN_TREND_KIND_BY_SUITE_TYPE: Record<SuiteType, EvalSystemHealthI18nKey> = {
  [SuiteType.Deployment]: EvalSystemHealthI18nKey.RunTrendsKindModel,
  [SuiteType.McpTool]: EvalSystemHealthI18nKey.RunTrendsKindToolset,
  [SuiteType.Route]: EvalSystemHealthI18nKey.RunTrendsKindRoute,
};

/** Weeks the health distribution chart shows by default; the title and the request both name it, so it is sent, not defaulted. */
export const HEALTH_DISTRIBUTION_WEEKS = 5;

/** Week counts the chart's period select offers; includes the default. */
export const HEALTH_DISTRIBUTION_WEEK_OPTIONS = [HEALTH_DISTRIBUTION_WEEKS, 8, 12];

/** The threshold is edited as a whole percentage and sent as a fraction of 1. */
export const HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MIN = 0;
export const HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MAX = 100;

/** Pass rate at or above which a test suite counts as healthy in a week; the backend's own default, sent explicitly. */
export const HEALTH_DISTRIBUTION_THRESHOLD = 0.75;

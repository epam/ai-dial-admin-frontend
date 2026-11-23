import { ActivityKind, CoverageKind } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

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

import { COST_AGGREGATION_STALE_AFTER_MS, COST_FETCH_MAX_WAIT_MS } from '@/src/components/Runs/Summary/constants';
import { COST_AGGREGATING_RUN_STATUSES, COST_UNSUPPORTED_SUITE_TYPES } from '@/src/constants/runs';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunStatus, RunTarget, RunTargetKind } from '@/src/models/evaluation/run';
import { fromCanonicalRouteName } from '@/src/utils/evaluation/route-reference';

const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const SCORE_DECIMALS = 3;

/**
 * Elapsed run time in ms, or `null` while the run has not settled — a run that started but never
 * completed has no duration yet, and must not read as `0`.
 */
export const getRunDurationMs = (run?: Run | null): number | null => {
  if (run?.startedAt == null || run?.completedAt == null) {
    return null;
  }
  const duration = run.completedAt - run.startedAt;
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
};

/**
 * Formats an elapsed run time, scaling to the magnitude a whole run reaches (seconds → minutes →
 * hours). Returns `null` for a missing duration so callers render the missing-value indication.
 */
export const formatRunDuration = (durationMs?: number | null): string | null => {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs < 0) {
    return null;
  }

  const totalSeconds = Math.round(durationMs / MS_IN_SECOND);
  if (totalSeconds < SECONDS_IN_MINUTE) {
    return `${Math.round(durationMs / 100) / 10}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / SECONDS_IN_MINUTE);
  if (totalMinutes < MINUTES_IN_HOUR) {
    return `${totalMinutes}m ${totalSeconds % SECONDS_IN_MINUTE}s`;
  }

  return `${Math.floor(totalMinutes / MINUTES_IN_HOUR)}h ${totalMinutes % MINUTES_IN_HOUR}m`;
};

/**
 * Formats an overall score as its numeric value. Returns `null` only when there is no score — `0`
 * is a real outcome and formats as `0.000`.
 */
export const formatRunScore = (score?: number | null): string | null => {
  if (score == null || !Number.isFinite(score)) {
    return null;
  }
  return score.toFixed(SCORE_DECIMALS);
};

/** Whether the run's suite type is one the backend never aggregates a cost for (MCP-tool and Route suites). */
export const isCostUnsupportedRun = (run?: Run | null): boolean => {
  const suiteType = run?.suiteSnapshot?.suiteType;
  return suiteType != null && COST_UNSUPPORTED_SUITE_TYPES.includes(suiteType);
};

/** Whether the run completed so long ago that a missing cost is final rather than still aggregating. */
export const isRunCostStale = (run: Run | null | undefined, now: number): boolean =>
  run?.completedAt != null && now - run.completedAt >= COST_AGGREGATION_STALE_AFTER_MS;

/**
 * Whether a run's cost is still being aggregated, as opposed to never going to exist. The backend
 * aggregates usage logs asynchronously after a run settles and cannot say "there will be no figure"
 * (e.g. an unpriced model), so a settled run with no cost counts as calculating only for
 * `COST_FETCH_MAX_WAIT_MS` — the same backstop the Summary cost cards use. The window opens at
 * `costWaitStartedAt` (when the grid first saw the run), or at `completedAt` for a run that settled
 * while the grid was watching it. Suites that cost aggregation does not support, and runs that
 * completed more than `COST_AGGREGATION_STALE_AFTER_MS` ago, are excluded.
 *
 * `graceMs` stretches the window, so a poller can still touch a row on the first tick after the
 * window closes and have the cell re-render as settled.
 */
export const isRunCostCalculating = (run: Run | null | undefined, now: number, graceMs = 0): boolean => {
  if (run == null || run.totalCost != null) {
    return false;
  }
  if (!COST_AGGREGATING_RUN_STATUSES.includes(run.status as RunStatus)) {
    return false;
  }
  if (isCostUnsupportedRun(run) || isRunCostStale(run, now)) {
    return false;
  }
  const waitStartedAt = run.costWaitStartedAt ?? run.completedAt;
  if (waitStartedAt == null) {
    return false;
  }
  return now - waitStartedAt < COST_FETCH_MAX_WAIT_MS + graceMs;
};

/**
 * Opens the cost wait window on settled runs that arrive without a cost, once: a run already stamped
 * keeps its original start, so reusing cached rows never restarts the wait.
 */
export const withCostWaitStart = (runs: Run[], now: number): Run[] =>
  runs.map((run) =>
    run.totalCost == null &&
    run.costWaitStartedAt == null &&
    COST_AGGREGATING_RUN_STATUSES.includes(run.status as RunStatus)
      ? { ...run, costWaitStartedAt: now }
      : run,
  );

const DEPLOYMENT_TYPE_TO_TARGET_KIND: Partial<Record<string, RunTargetKind>> = {
  [DeploymentType.Model]: RunTargetKind.Model,
  [DeploymentType.Application]: RunTargetKind.Application,
};

/**
 * The run's evaluated entity, from its `suiteSnapshot`. An MCP deployment ref always resolves to
 * `RunTargetKind.Mcp`; a model/application ref's kind comes from its own `type`
 * (`dial-model` / `dial-application`) rather than the suite's `suiteType`, since a snapshot can carry
 * a `deploymentRef` without a recognized `type` — that case leaves `kind` unset instead of guessing
 * between Model and Application.
 */
export const resolveRunTarget = (run?: Run | null): RunTarget | null => {
  const snapshot = run?.suiteSnapshot;

  const mcpName = snapshot?.mcpDeploymentRef?.name;
  if (mcpName) {
    return { name: mcpName, kind: RunTargetKind.Mcp };
  }

  const routeName = snapshot?.routesRef?.name;
  if (routeName) {
    return { name: fromCanonicalRouteName(routeName), kind: RunTargetKind.Route };
  }

  const deploymentName = snapshot?.deploymentRef?.name;
  if (!deploymentName) {
    return null;
  }
  const deploymentType = snapshot?.deploymentRef?.type;
  return { name: deploymentName, kind: deploymentType ? DEPLOYMENT_TYPE_TO_TARGET_KIND[deploymentType] : undefined };
};

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunTarget, RunTargetKind } from '@/src/models/evaluation/run';

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

  const deploymentName = snapshot?.deploymentRef?.name;
  if (!deploymentName) {
    return null;
  }
  const deploymentType = snapshot?.deploymentRef?.type;
  return { name: deploymentName, kind: deploymentType ? DEPLOYMENT_TYPE_TO_TARGET_KIND[deploymentType] : undefined };
};

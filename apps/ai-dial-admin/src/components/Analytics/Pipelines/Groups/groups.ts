import {
  GroupCheck,
  GroupCondition,
  GroupConditionRole,
  GroupState,
  GroupStateResult,
  ReadinessSummary,
} from '@/src/components/Analytics/Pipelines/Groups/models';
import { CONDITION_META } from '@/src/components/Analytics/Pipelines/Groups/constants';
import { ReadyWhen } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { durationToMs } from '@/src/utils/analytics/duration';

/** The UTC day of an instant, spelled as the runner spells `evaluations_day`. */
const utcDay = (now: number): string => new Date(now).toISOString().slice(0, 10);

/**
 * The conditions the pipeline declares, triggers first, in the order the readiness editor presents them. A
 * pipeline that declares no `idle` still has one — the runner's own default — so it is listed as such.
 */
export const declaredConditions = (readyWhen?: ReadyWhen): GroupCondition[] => [
  readyWhen?.idle ? GroupCondition.Idle : GroupCondition.DefaultIdle,
  ...(readyWhen?.signal ? [GroupCondition.Signal] : []),
  ...(readyWhen?.max_staleness ? [GroupCondition.MaxStaleness] : []),
  ...(readyWhen?.cost_ceiling != null ? [GroupCondition.CostCeiling] : []),
];

/**
 * The group's evaluations for the current UTC day. The runner resets the count by the day it belongs to, not on
 * a schedule, so a count recorded against an earlier day is zero today however large it is.
 */
export const evaluationsToday = (group: PipelineGroup, now: number): number =>
  group.evaluations_day === utcDay(now) ? group.evaluations : 0;

/**
 * Whether the group has spent today's evaluations. Separate from `At cap`, which only a dirty group can be: a
 * clean group at its ceiling reads `Up to date`, yet evaluating it again would still be charged past the limit.
 */
export const isAtCeiling = (group: PipelineGroup, readyWhen: ReadyWhen | undefined, now: number): boolean =>
  readyWhen?.cost_ceiling != null && evaluationsToday(group, now) >= readyWhen.cost_ceiling;

/** When today's evaluation count resets: the next UTC midnight. */
export const nextUtcMidnight = (now: number): number => {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
};

/** What a check states beyond which condition it is; the role comes from `CONDITION_META`. */
type CheckFacts = Omit<GroupCheck, 'condition' | 'role'>;

/** A duration check: how long against how long, and how much is left. An unreadable threshold is never met. */
const elapsedCheck = (elapsed: number | undefined, threshold?: number): CheckFacts => ({
  isSatisfied: elapsed != null && threshold != null && elapsed >= threshold,
  value: elapsed,
  threshold,
  remaining: elapsed != null && threshold != null ? Math.max(0, threshold - elapsed) : undefined,
});

type CheckBuilder = (group: PipelineGroup, readyWhen: ReadyWhen | undefined, now: number) => CheckFacts;

const CHECKS: Record<GroupCondition, CheckBuilder> = {
  [GroupCondition.Idle]: (group, readyWhen, now) =>
    elapsedCheck(now - Date.parse(group.last_activity_at), durationToMs(readyWhen?.idle)),

  // The runner takes a ready group within seconds and stamps it once written, so a group still holding new rows
  // has not been taken — which is all the console can know about a window it is not told the length of.
  [GroupCondition.DefaultIdle]: (group, _readyWhen, now) => ({
    isSatisfied: !group.dirty,
    value: now - Date.parse(group.last_activity_at),
  }),

  [GroupCondition.Signal]: (group) => ({ isSatisfied: group.signalled }),

  // Measured from the last evaluation, so a group never evaluated has no age to compare.
  [GroupCondition.MaxStaleness]: (group, readyWhen, now) =>
    elapsedCheck(
      group.computed_at ? now - Date.parse(group.computed_at) : undefined,
      durationToMs(readyWhen?.max_staleness),
    ),

  [GroupCondition.CostCeiling]: (group, readyWhen, now) => {
    const used = evaluationsToday(group, now);
    const ceiling = readyWhen?.cost_ceiling ?? 0;

    return {
      isSatisfied: used < ceiling,
      value: used,
      threshold: ceiling,
    };
  },
};

/**
 * Where a group stands, from the runner's facts against the pipeline's saved `ready_when`. The runner reports
 * no verdict, so this is the one place one is reached. Its consumers agree only when they pass the same `now`,
 * which is why the tab hands its one clock to all of them.
 */
export const deriveGroupState = (
  group: PipelineGroup,
  readyWhen: ReadyWhen | undefined,
  now: number,
): GroupStateResult => {
  const checks = declaredConditions(readyWhen).map((condition) => ({
    condition,
    role: CONDITION_META[condition].role,
    ...CHECKS[condition](group, readyWhen, now),
  }));

  if (!group.dirty) return { state: GroupState.UpToDate, checks };

  const isLimited = checks.some((check) => check.role === GroupConditionRole.Limit && !check.isSatisfied);
  if (isLimited) return { state: GroupState.AtCap, checks };

  const isTriggered = checks.some((check) => check.role === GroupConditionRole.Trigger && check.isSatisfied);
  return { state: isTriggered ? GroupState.Ready : GroupState.Waiting, checks };
};

/** The readiness rule in the declaration's own terms, for the summary above the grid. */
export const readinessSummary = (readyWhen?: ReadyWhen): ReadinessSummary => {
  const valueOf: Record<GroupCondition, string | undefined> = {
    [GroupCondition.Idle]: readyWhen?.idle,
    [GroupCondition.DefaultIdle]: undefined,
    [GroupCondition.Signal]: readyWhen?.signal,
    [GroupCondition.MaxStaleness]: readyWhen?.max_staleness,
    [GroupCondition.CostCeiling]: readyWhen?.cost_ceiling == null ? undefined : String(readyWhen.cost_ceiling),
  };

  const items = declaredConditions(readyWhen).map((condition) => ({ condition, value: valueOf[condition] }));

  return {
    triggers: items.filter((item) => CONDITION_META[item.condition].role === GroupConditionRole.Trigger),
    limits: items.filter((item) => CONDITION_META[item.condition].role === GroupConditionRole.Limit),
  };
};

// What the runner's request firewall or servlet container refuses in a path segment however it is encoded. A copy of
// the runner's own list (runner-ops, "A group key containing a slash is addressable"), kept here so the console does
// not offer an evaluation that can only be refused — under OIDC, as a 401 that names the wrong cause.
const UNADDRESSABLE_PARTS = ['//', '%', ';', '\\', '\n', '\r', '\u2028', '\u2029'];
const DOT_SEGMENTS = new Set(['.', '..']);

/** Whether the runner can be asked to evaluate the group with this key. */
export const isAddressableGroupKey = (key: string): boolean =>
  key !== '' &&
  !UNADDRESSABLE_PARTS.some((part) => key.includes(part)) &&
  !key.split('/').some((segment) => DOT_SEGMENTS.has(segment));

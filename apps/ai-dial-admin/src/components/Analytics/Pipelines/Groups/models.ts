import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

/** Where a group stands against its pipeline's readiness rule, in the order the checks are made. */
export enum GroupState {
  UpToDate = 'up_to_date',
  AtCap = 'at_cap',
  Ready = 'ready',
  Waiting = 'waiting',
}

/** Every condition a readiness rule can carry, `DefaultIdle` standing in for an `idle` the pipeline left out. */
export enum GroupCondition {
  Idle = 'idle',
  DefaultIdle = 'default_idle',
  Signal = 'signal',
  MaxStaleness = 'max_staleness',
  CostCeiling = 'cost_ceiling',
}

/** A trigger makes a group with new rows ready; a limit holds a group back whatever trigger it meets. */
export enum GroupConditionRole {
  Trigger = 'trigger',
  Limit = 'limit',
}

export interface ConditionMeta {
  role: GroupConditionRole;
  summaryKey: AnalyticsPipelinesI18nKey;
}

/**
 * One declared condition checked against one group.
 *
 * `isSatisfied` reads the same way for both roles — a trigger that has occurred, a limit not yet reached — so
 * a checklist marks every line by it alone. Durations are milliseconds and counts are evaluations; a member is
 * absent where the condition has nothing to state, such as a staleness check on a group never evaluated, or the
 * threshold of a default idle the runner does not report.
 */
export interface GroupCheck {
  condition: GroupCondition;
  role: GroupConditionRole;
  isSatisfied: boolean;
  value?: number;
  threshold?: number;
  remaining?: number;
}

export interface GroupStateResult {
  state: GroupState;
  checks: GroupCheck[];
}

/**
 * One line of the readiness summary. `value` is the declaration's own spelling — a duration, the signal
 * predicate, the ceiling — and is absent for the default idle.
 */
export interface ReadinessItem {
  condition: GroupCondition;
  value?: string;
}

export interface ReadinessSummary {
  triggers: ReadinessItem[];
  limits: ReadinessItem[];
}

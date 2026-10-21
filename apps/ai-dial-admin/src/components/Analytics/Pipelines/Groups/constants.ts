import {
  ConditionMeta,
  GroupCondition,
  GroupConditionRole,
  GroupState,
} from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

/**
 * What is fixed about each condition: which side of the rule it is on, and how the summary words it.
 *
 * Adding a runner condition starts here and continues in `groups.ts` — its check in `CHECKS` and its declared
 * value in `readinessSummary`, both of which the compiler names once this entry exists — then in
 * `declaredConditions`, which decides whether a pipeline carries it, and in `ConditionCheckLine`, which words it
 * against a group's facts.
 */
export const CONDITION_META: Record<GroupCondition, ConditionMeta> = {
  [GroupCondition.Idle]: {
    role: GroupConditionRole.Trigger,
    summaryKey: AnalyticsPipelinesI18nKey.GroupsConditionIdle,
  },
  [GroupCondition.DefaultIdle]: {
    role: GroupConditionRole.Trigger,
    summaryKey: AnalyticsPipelinesI18nKey.GroupsConditionDefaultIdle,
  },
  [GroupCondition.Signal]: {
    role: GroupConditionRole.Trigger,
    summaryKey: AnalyticsPipelinesI18nKey.GroupsConditionSignal,
  },
  [GroupCondition.MaxStaleness]: {
    role: GroupConditionRole.Trigger,
    summaryKey: AnalyticsPipelinesI18nKey.GroupsConditionStaleness,
  },
  [GroupCondition.CostCeiling]: {
    role: GroupConditionRole.Limit,
    summaryKey: AnalyticsPipelinesI18nKey.GroupsConditionCeiling,
  },
};

export const GROUP_STATE_LABEL_KEY: Record<GroupState, AnalyticsPipelinesI18nKey> = {
  [GroupState.UpToDate]: AnalyticsPipelinesI18nKey.GroupStateUpToDate,
  [GroupState.AtCap]: AnalyticsPipelinesI18nKey.GroupStateAtCap,
  [GroupState.Ready]: AnalyticsPipelinesI18nKey.GroupStateReady,
  [GroupState.Waiting]: AnalyticsPipelinesI18nKey.GroupStateWaiting,
};

/** The states the filter offers, in the order a reader triages them. */
export const GROUP_STATE_ORDER: GroupState[] = [
  GroupState.Waiting,
  GroupState.Ready,
  GroupState.AtCap,
  GroupState.UpToDate,
];

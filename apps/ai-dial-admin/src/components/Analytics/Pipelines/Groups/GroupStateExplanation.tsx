'use client';

import { FC } from 'react';

import ConditionChecklist from '@/src/components/Analytics/Pipelines/Groups/ConditionChecklist';
import { deriveGroupState } from '@/src/components/Analytics/Pipelines/Groups/groups';
import { GroupConditionRole, GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ReadyWhen } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

interface Props {
  group: PipelineGroup;
  readyWhen?: ReadyWhen;
  isPaused: boolean;
  now: number;
}

/** Why the group is in its state, from the same checks that put it there. */
const GroupStateExplanation: FC<Props> = ({ group, readyWhen, isPaused, now }) => {
  const t = useI18n();
  const { state, checks } = deriveGroupState(group, readyWhen, now);

  // A pause skips the readiness sweep, so a met trigger does nothing, and a checklist alone would say otherwise.
  const isHeld = isPaused && (state === GroupState.Ready || state === GroupState.Waiting);

  return (
    <div className="flex max-w-[320px] flex-col gap-2">
      {isHeld && <p className="dial-small-text text-warning">{t(AnalyticsPipelinesI18nKey.GroupsHintPaused)}</p>}

      {(state === GroupState.Waiting || state === GroupState.AtCap) && <ConditionChecklist checks={checks} now={now} />}

      {state === GroupState.Ready && (
        <>
          <ConditionChecklist
            checks={checks.filter((check) => check.role === GroupConditionRole.Trigger && check.isSatisfied)}
            now={now}
          />
          {!isHeld && <p className="dial-small-text text-secondary">{t(AnalyticsPipelinesI18nKey.GroupsHintReady)}</p>}
        </>
      )}

      {state === GroupState.UpToDate && (
        <p className="dial-small-text text-primary">
          {t(AnalyticsPipelinesI18nKey.GroupsHintUpToDate, { age: formatRelativeTime(group.computed_at ?? null, now) })}
        </p>
      )}
    </div>
  );
};

export default GroupStateExplanation;

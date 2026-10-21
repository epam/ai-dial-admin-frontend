'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

import StatusPill from '@/src/components/Analytics/Common/StatusPill';
import { GROUP_STATE_LABEL_KEY } from '@/src/components/Analytics/Pipelines/Groups/constants';
import GroupStateExplanation from '@/src/components/Analytics/Pipelines/Groups/GroupStateExplanation';
import { GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { useI18n } from '@/src/locales/client';
import { ReadyWhen } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';

interface Props {
  group: PipelineGroup;
  state: GroupState;
  readyWhen?: ReadyWhen;
  isPaused: boolean;
  now: number;
}

const TONE: Record<GroupState, string> = {
  [GroupState.Waiting]: 'text-info bg-info',
  [GroupState.Ready]: 'text-success bg-success',
  [GroupState.AtCap]: 'text-warning bg-warning',
  [GroupState.UpToDate]: 'text-secondary bg-layer-4',
};

/**
 * The group's state as a badge that explains itself. Focusable, so the explanation opens from the keyboard as
 * well as on hover, and the trigger carries it to assistive technology through `asChild`.
 */
const GroupStateBadge: FC<Props> = ({ group, state, readyWhen, isPaused, now }) => {
  const t = useI18n();

  return (
    <Tooltip
      tooltip={<GroupStateExplanation group={group} readyWhen={readyWhen} isPaused={isPaused} now={now} />}
      asChild
    >
      <StatusPill
        // Focusable: focus is how the explanation is reached from the keyboard.
        tabIndex={0}
        label={t(GROUP_STATE_LABEL_KEY[state])}
        toneClassName={TONE[state]}
        className="focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary"
      />
    </Tooltip>
  );
};

export default GroupStateBadge;

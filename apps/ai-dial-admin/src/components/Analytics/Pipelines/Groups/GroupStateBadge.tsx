'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

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
      <span
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focus is how the explanation is reached
        tabIndex={0}
        className={classNames(
          'inline-flex items-center rounded-full px-2 py-0.5 uppercase dial-caption-text font-semibold',
          'focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary',
          TONE[state],
        )}
      >
        {t(GROUP_STATE_LABEL_KEY[state])}
      </span>
    </Tooltip>
  );
};

export default GroupStateBadge;

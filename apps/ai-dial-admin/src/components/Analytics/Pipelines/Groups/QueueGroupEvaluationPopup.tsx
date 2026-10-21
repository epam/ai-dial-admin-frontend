'use client';

import { FC } from 'react';

import {
  ButtonVariant,
  Notification,
  NotificationType,
  NotificationVariant,
  Popup,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import ConditionChecklist from '@/src/components/Analytics/Pipelines/Groups/ConditionChecklist';
import GroupKey from '@/src/components/Analytics/Pipelines/Groups/GroupKey';
import GroupFact from '@/src/components/Analytics/Pipelines/Groups/GroupFact';
import { deriveGroupState, evaluationsToday } from '@/src/components/Analytics/Pipelines/Groups/groups';
import { GroupConditionRole, GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ReadyWhen } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

interface Props {
  group: PipelineGroup;
  readyWhen?: ReadyWhen;
  isPaused: boolean;
  isGenerationBehind: boolean;
  now: number;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * The confirmation for one group's evaluation, worded for the state the group is in: a waiting group is
 * evaluated before its triggers, an up-to-date one again on rows already judged. Informational rather than
 * danger — nothing is destroyed — but it says what the call costs where the pipeline counts it.
 *
 * The notes are page content, not updates, so they carry `role="note"` rather than the live-region role the
 * notification would otherwise announce itself with.
 */
const QueueGroupEvaluationPopup: FC<Props> = ({
  group,
  readyWhen,
  isPaused,
  isGenerationBehind,
  now,
  onConfirm,
  onClose,
}) => {
  const t = useI18n();
  const { state, checks } = deriveGroupState(group, readyWhen, now);

  const ceiling = readyWhen?.cost_ceiling;
  const used = evaluationsToday(group, now);
  const triggers = checks.filter((check) => check.role === GroupConditionRole.Trigger);
  const isUpToDate = state === GroupState.UpToDate;
  const isLastSlot = ceiling != null && used + 1 >= ceiling;

  const lastEvaluated = group.computed_at
    ? formatRelativeTime(group.computed_at, now)
    : t(AnalyticsPipelinesI18nKey.GroupsNever);

  return (
    <Popup
      open
      size={PopupSize.Lg}
      header={t(AnalyticsPipelinesI18nKey.GroupsQueueTitle)}
      onClose={onClose}
      mainButtons={[
        { label: t(ButtonsI18nKey.Cancel), onClick: onClose },
        {
          label: t(AnalyticsPipelinesI18nKey.GroupsQueue),
          variant: ButtonVariant.Primary,
          onClick: onConfirm,
        },
      ]}
    >
      <div className="flex flex-col gap-4 px-6 pb-2">
        {/* An up-to-date group has nothing new to judge, so the lead sentence is the warning itself. */}
        {isUpToDate ? (
          <Notification
            role="note"
            variant={NotificationVariant.Warning}
            type={NotificationType.SectionMessage}
            message={t(AnalyticsPipelinesI18nKey.GroupsQueueUpToDate, { age: lastEvaluated })}
          />
        ) : (
          <p className="dial-body-text text-primary">{t(AnalyticsPipelinesI18nKey.GroupsQueueWaiting)}</p>
        )}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded border border-secondary bg-layer-2 p-4 sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <GroupFact label={t(AnalyticsPipelinesI18nKey.GroupsColumnKey)}>
            <GroupKey value={group.group_key} />
          </GroupFact>
          <GroupFact label={t(AnalyticsPipelinesI18nKey.GroupsColumnLastActivity)}>
            {formatRelativeTime(group.last_activity_at, now)}
          </GroupFact>
          <GroupFact label={t(AnalyticsPipelinesI18nKey.GroupsColumnLastEvaluated)}>{lastEvaluated}</GroupFact>
          <GroupFact label={t(AnalyticsPipelinesI18nKey.GroupsColumnEvaluations)}>
            {ceiling == null ? used : `${used} / ${ceiling}`}
          </GroupFact>
        </dl>

        {!isUpToDate && (
          <section
            aria-label={t(AnalyticsPipelinesI18nKey.GroupsQueueSkippedTriggers)}
            className="flex flex-col gap-3 rounded border border-secondary p-4"
          >
            <h3 className="dial-tiny-text uppercase tracking-wide text-secondary">
              {t(AnalyticsPipelinesI18nKey.GroupsQueueSkippedTriggers)}
            </h3>
            <ConditionChecklist checks={triggers} now={now} />
          </section>
        )}

        {/* The usage is in the facts above; it is worth a warning only when this evaluation spends the last one. */}
        {isLastSlot ? (
          <Notification
            role="note"
            variant={NotificationVariant.Warning}
            type={NotificationType.SectionMessage}
            message={t(AnalyticsPipelinesI18nKey.GroupsQueueCeiling)}
          />
        ) : null}
        {/* Most often reached right after a prompt or model edit, which is exactly when the runner may not have
            synced it yet — and then this evaluation is spent on the declaration being replaced. */}
        {isGenerationBehind && (
          <Notification
            role="note"
            variant={NotificationVariant.Warning}
            type={NotificationType.SectionMessage}
            message={t(AnalyticsPipelinesI18nKey.GroupsQueueGenerationBehind)}
          />
        )}
        {isPaused && (
          <Notification
            role="note"
            variant={NotificationVariant.Warning}
            type={NotificationType.SectionMessage}
            message={t(AnalyticsPipelinesI18nKey.GroupsQueuePaused)}
          />
        )}
      </div>
    </Popup>
  );
};

export default QueueGroupEvaluationPopup;

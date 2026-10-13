'use client';

import { FC } from 'react';

import {
  Button,
  ButtonVariant,
  ElementSize,
  Notification,
  NotificationType,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';

import { PIPELINE_PAUSE_REASON_MESSAGE } from '@/src/constants/analytics/backfill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineBackfillRun, PipelineBackfillState } from '@/src/models/analytics/pipeline-backfill';

interface Props {
  run: PipelineBackfillRun;
  onOpen: () => void;
}

/**
 * Announces a backfill that is running or paused, with the reason for a pause. Whether to show it is the caller's
 * (`shouldShowPipelineBackfillBanner`): a run paused with its pipeline is left to the pipeline's own banner.
 */
const PipelineBackfillBanner: FC<Props> = ({ run, onOpen }) => {
  const t = useI18n();
  const isPaused = run.state === PipelineBackfillState.Paused;

  return (
    <Notification
      variant={isPaused ? NotificationVariant.Warning : NotificationVariant.Info}
      type={NotificationType.SectionMessage}
      role="status"
      title={t(isPaused ? BackfillI18nKey.BannerPaused : BackfillI18nKey.BannerRunning)}
      message={isPaused && run.paused_reason ? t(PIPELINE_PAUSE_REASON_MESSAGE[run.paused_reason]) : undefined}
      action={
        <Button
          variant={ButtonVariant.Secondary}
          size={ElementSize.Small}
          label={t(BackfillI18nKey.ViewRun)}
          onClick={onOpen}
        />
      }
    />
  );
};

export default PipelineBackfillBanner;

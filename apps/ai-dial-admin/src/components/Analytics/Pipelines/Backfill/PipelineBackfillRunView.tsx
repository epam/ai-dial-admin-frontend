'use client';

import { FC, useCallback, useState } from 'react';

import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  ConfirmationPopup,
  ConfirmationPopupVariant,
  ElementSize,
} from '@epam/ai-dial-ui-kit';

import BackfillRunFacts from '@/src/components/Analytics/Common/BackfillSidebar/BackfillRunFacts';
import BackfillStatusBadge from '@/src/components/Analytics/Common/BackfillSidebar/BackfillStatusBadge';
import RequeueFailuresPopup from '@/src/components/Analytics/Pipelines/Failures/RequeueFailuresPopup';
import { useRunDeadLetters } from '@/src/components/Analytics/Pipelines/Backfill/use-run-dead-letters';
import { useRequeueFailures } from '@/src/components/Analytics/Pipelines/Failures/use-requeue-failures';
import { PIPELINE_PAUSE_REASON_MESSAGE } from '@/src/constants/analytics/backfill';
import { BackfillI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BackfillStatus, BackfillTone } from '@/src/models/analytics/backfill-ui';
import {
  PipelineBackfillRun,
  PipelineBackfillState,
  PipelineBackfillVerb,
} from '@/src/models/analytics/pipeline-backfill';
import {
  formatBackfillWindow,
  getPipelineBackfillStatus,
  getTodayUtc,
  getWindowView,
} from '@/src/utils/analytics/backfill';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  pipelineName: string;
  run: PipelineBackfillRun;
  /** From the pipeline's declaration, not from the run: it decides whether a finished run reads Queued. */
  isGroupTrigger: boolean;
  isPipelinePaused: boolean;
  isBusy: boolean;
  onVerb: (verb: PipelineBackfillVerb, runId: string) => Promise<void>;
}

/**
 * One pipeline run: its controls, then its figures.
 *
 * Resume is withheld while the pipeline is paused: the runner repeats the start checks on a resume and refuses it
 * then, so the button could only fail. Cancel has no such check and stays.
 *
 * A finished run is repeated by re-running its dead letters, never by a new run over the same window: the runner has
 * no "already processed" test, so that would replay every row at full cost.
 */
const PipelineBackfillRunView: FC<Props> = ({
  pipelineName,
  run,
  isGroupTrigger,
  isPipelinePaused,
  isBusy,
  onVerb,
}) => {
  const t = useI18n();
  const [isCancelPromptOpen, setIsCancelPromptOpen] = useState(false);
  const [isRequeuePromptOpen, setIsRequeuePromptOpen] = useState(false);

  const deadLetters = useRunDeadLetters(pipelineName, run.id, run.state);
  const requeue = useRequeueFailures({
    pipelineName,
    isPaused: isPipelinePaused,
    onRequeued: deadLetters.reload,
  });

  const status = getPipelineBackfillStatus(run.state, isGroupTrigger);
  const isRunning = run.state === PipelineBackfillState.Running;
  const isPaused = run.state === PipelineBackfillState.Paused;
  const isControlDisabled = isBusy || requeue.isBusy;
  const isResumeOffered = isPaused && !isPipelinePaused;
  const windowText = formatBackfillWindow(getWindowView(run.window_from, run.window_to), getTodayUtc(new Date()), t);

  const onPause = useCallback(() => void onVerb(PipelineBackfillVerb.Pause, run.id), [onVerb, run.id]);
  const onResume = useCallback(() => void onVerb(PipelineBackfillVerb.Resume, run.id), [onVerb, run.id]);
  const onOpenCancelPrompt = useCallback(() => setIsCancelPromptOpen(true), []);
  const onCloseCancelPrompt = useCallback(() => setIsCancelPromptOpen(false), []);
  const onConfirmCancel = useCallback(() => {
    setIsCancelPromptOpen(false);
    void onVerb(PipelineBackfillVerb.Cancel, run.id);
  }, [onVerb, run.id]);
  const onOpenRequeuePrompt = useCallback(() => setIsRequeuePromptOpen(true), []);
  const onCloseRequeuePrompt = useCallback(() => setIsRequeuePromptOpen(false), []);
  const onConfirmRequeue = useCallback(() => {
    setIsRequeuePromptOpen(false);
    void requeue.retryMany(run.id, deadLetters.requeueable);
  }, [requeue, run.id, deadLetters.requeueable]);

  return (
    <div className="flex flex-col gap-y-4">
      {(isRunning || isPaused) && (
        <div className="grid grid-cols-2 gap-3">
          {isRunning && (
            <Button
              variant={ButtonVariant.Neutral}
              size={ElementSize.Large}
              label={t(BackfillI18nKey.Pause)}
              disabled={isControlDisabled}
              onClick={onPause}
            />
          )}
          {isResumeOffered && (
            <Button
              variant={ButtonVariant.Primary}
              size={ElementSize.Large}
              label={t(BackfillI18nKey.Resume)}
              disabled={isControlDisabled}
              onClick={onResume}
            />
          )}
          <Button
            variant={ButtonVariant.Danger}
            appearance={ButtonAppearance.Outlined}
            size={ElementSize.Large}
            label={t(BackfillI18nKey.Cancel)}
            disabled={isControlDisabled}
            onClick={onOpenCancelPrompt}
          />
        </div>
      )}

      {isPaused && isPipelinePaused && (
        <p className="m-0 text-warning dial-small">{t(BackfillI18nKey.ResumeBlockedByPipeline)}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <BackfillStatusBadge status={status} />
      </div>

      {status === BackfillStatus.Queued && (
        <p className="m-0 text-secondary dial-small">{t(BackfillI18nKey.StatusQueuedHint)}</p>
      )}

      {isRunning && run.last_error && (
        <p className="m-0 text-warning dial-small" role="status">
          {t(BackfillI18nKey.Retrying)} {run.last_error}
          {run.last_error_at && ` (${formatDateTimeToLocalString(run.last_error_at)})`}
        </p>
      )}

      {isPaused && run.paused_reason && (
        <p className="m-0 text-warning dial-small">
          {t(PIPELINE_PAUSE_REASON_MESSAGE[run.paused_reason])}
          {run.paused_at && ` ${t(BackfillI18nKey.PausedAt)} ${formatDateTimeToLocalString(run.paused_at)}.`}
        </p>
      )}

      <BackfillRunFacts
        runId={run.id}
        windowText={windowText}
        outcome={[
          [
            { label: t(BackfillI18nKey.RowsDone), value: run.rows_done.toLocaleString() },
            {
              label: t(BackfillI18nKey.DeadLetters),
              value: deadLetters.total ?? '—',
              tone: deadLetters.total ? BackfillTone.Error : undefined,
            },
          ],
        ]}
        startedAt={run.started_at}
        finishedAt={run.finished_at}
      />

      {deadLetters.requeueable > 0 && (
        <Button
          variant={ButtonVariant.Secondary}
          size={ElementSize.Small}
          label={t(BackfillI18nKey.Requeue, { count: deadLetters.requeueable })}
          disabled={isControlDisabled}
          onClick={onOpenRequeuePrompt}
        />
      )}

      <span role="status" aria-live="polite" className="text-secondary dial-small empty:hidden">
        {requeue.outcome}
      </span>

      {isCancelPromptOpen && (
        <ConfirmationPopup
          open
          variant={ConfirmationPopupVariant.Danger}
          header={t(BackfillI18nKey.CancelConfirmTitle)}
          description={t(BackfillI18nKey.CancelConfirmDescription)}
          confirmLabel={t(BackfillI18nKey.Cancel)}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onConfirm={onConfirmCancel}
          onClose={onCloseCancelPrompt}
          onCancel={onCloseCancelPrompt}
        />
      )}

      {isRequeuePromptOpen && (
        <RequeueFailuresPopup
          count={deadLetters.requeueable}
          runId={run.id}
          activeFilters={[]}
          isPaused={isPipelinePaused}
          onConfirm={onConfirmRequeue}
          onClose={onCloseRequeuePrompt}
        />
      )}
    </div>
  );
};

export default PipelineBackfillRunView;

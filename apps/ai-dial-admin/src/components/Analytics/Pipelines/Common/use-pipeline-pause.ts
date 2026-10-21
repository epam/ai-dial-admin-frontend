'use client';

import { useCallback, useState } from 'react';

import { pausePipeline, resumePipeline } from '@/src/app/[lang]/pipelines/actions';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { RUNNER_CACHE_COLD } from '@/src/models/analytics/pipeline-runtime';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

/** The one code this hook names that the runtime model does not, since only a write path meets it. */
const RUNNER_STATE_DB_DOWN = 'postgres_unavailable';

export interface PipelinePauseControls {
  /** A pause or a resume is in flight; both controls are non-interactive while it is. */
  isBusy: boolean;
  isConfirmOpen: boolean;
  openConfirm: () => void;
  closeConfirm: () => void;
  confirmPause: () => Promise<void>;
  resume: () => Promise<void>;
}

/**
 * Pause and resume for one pipeline, with the reporting each outcome needs.
 *
 * Pausing is confirmed and resuming is not: resume restores the ordinary state and is the undo of the
 * act that was already confirmed.
 *
 * Neither is gated on unsaved form edits, unlike the enable/disable control. That gate exists because
 * toggling re-reads the pipeline and would discard the draft; a pause sends no part of the document and
 * triggers no such re-read, and withholding it during an incident — when the form is most likely to be
 * half-edited — would withhold it for a reason that does not apply.
 */
export const usePipelinePause = (name: string, onChanged: () => Promise<void>): PipelinePauseControls => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isBusy, setIsBusy] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // The runner's message is the authority on what went wrong; these two only add what the operator can
  // do about it, for the codes where the answer differs — one clears by itself, the other does not.
  const failureMessage = useCallback(
    (res: ServerActionResponse) => {
      if (res.errorHeader === RUNNER_CACHE_COLD) return t(AnalyticsPipelinesI18nKey.RunnerCold);
      if (res.errorHeader === RUNNER_STATE_DB_DOWN) return t(AnalyticsPipelinesI18nKey.RunnerStateDbDown);
      return res.errorMessage;
    },
    [t],
  );

  const run = useCallback(
    async (act: () => Promise<ServerActionResponse>, successKey: string, failureKey: string) => {
      if (isBusy) return;

      setIsBusy(true);
      const res = await act();

      if (res.success) {
        showNotification(getSuccessNotification(t(successKey)));
        await onChanged();
      } else {
        showNotification(getErrorNotification(t(failureKey), failureMessage(res), res.requestId));
      }

      setIsBusy(false);
    },
    [isBusy, showNotification, t, onChanged, failureMessage],
  );

  const confirmPause = useCallback(async () => {
    setIsConfirmOpen(false);
    await run(
      () => pausePipeline(name),
      AnalyticsPipelinesI18nKey.PipelinePaused,
      AnalyticsPipelinesI18nKey.PauseFailed,
    );
  }, [name, run]);

  const resume = useCallback(
    () =>
      run(
        () => resumePipeline(name),
        AnalyticsPipelinesI18nKey.PipelineResumed,
        AnalyticsPipelinesI18nKey.ResumeFailed,
      ),
    [name, run],
  );

  return {
    isBusy,
    isConfirmOpen,
    openConfirm: () => setIsConfirmOpen(true),
    closeConfirm: () => setIsConfirmOpen(false),
    confirmPause,
    resume,
  };
};

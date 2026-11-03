'use client';

import { useCallback, useState } from 'react';

import { resumePipeline } from '@/src/app/[lang]/pipelines/actions';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { RUNNER_CACHE_COLD } from '@/src/models/analytics/pipeline-runtime';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

/** The one code this hook names that the runtime model does not, since only a write path meets it. */
const RUNNER_STATE_DB_DOWN = 'postgres_unavailable';

export interface PipelineResumeControls {
  isBusy: boolean;
  resume: () => Promise<void>;
}

/**
 * Resume for one pipeline's circuit-breaker pause, with the reporting each outcome needs.
 *
 * Not confirmed: it lifts a pause that would lift itself. Not gated on unsaved form edits, unlike the
 * enable/disable control: it sends no part of the document and triggers no re-read of it.
 *
 * The runtime view is read again after a refusal too: the runner refuses a resume once the breaker has
 * lifted the pause by itself, and the banner would otherwise keep offering a control for a pause that is gone.
 */
export const usePipelineResume = (name: string, onChanged: () => Promise<void>): PipelineResumeControls => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isBusy, setIsBusy] = useState(false);

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

  const resume = useCallback(async () => {
    if (isBusy) return;

    setIsBusy(true);
    const res = await resumePipeline(name);

    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsPipelinesI18nKey.PipelineResumed)));
    } else {
      showNotification(
        getErrorNotification(t(AnalyticsPipelinesI18nKey.ResumeFailed), failureMessage(res), res.requestId),
      );
    }

    await onChanged();
    setIsBusy(false);
  }, [isBusy, name, showNotification, t, onChanged, failureMessage]);

  return { isBusy, resume };
};

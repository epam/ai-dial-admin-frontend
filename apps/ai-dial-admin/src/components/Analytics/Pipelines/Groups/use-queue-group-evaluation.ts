'use client';

import { useCallback, useMemo, useState } from 'react';

import { queueGroupEvaluation } from '@/src/app/[lang]/pipelines/actions';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { RUNNER_PIPELINE_NOT_FOUND } from '@/src/models/analytics/pipeline-runtime';
import { getErrorNotification } from '@/src/utils/notification';

export interface QueueGroupControls {
  /** A request is in flight; every Queue evaluation control is non-interactive while one is. */
  isBusy: boolean;
  /** What the last request did, for the tab's live region. Cleared when the next one starts. */
  outcome: string;
  queue: (groupKey: string) => Promise<void>;
}

interface Params {
  pipelineName: string;
  onQueued: () => Promise<void>;
}

/**
 * Queues one group's evaluation and reports what happened, the way the failures re-run does: success as a
 * status message on the tab — worded as queued, because the runner answers before it evaluates — and a refusal
 * as the service's own message with its request id.
 *
 * Every outcome re-reads, success or not. A 404 means the runner no longer tracks the group — evicted since the
 * tab was read — so the row on screen is the thing that is wrong.
 */
export const useQueueGroupEvaluation = ({ pipelineName, onQueued }: Params): QueueGroupControls => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isBusy, setIsBusy] = useState(false);
  const [outcome, setOutcome] = useState('');

  const queue = useCallback(
    async (groupKey: string) => {
      if (isBusy) return;

      setIsBusy(true);
      setOutcome('');

      try {
        const res = await queueGroupEvaluation(pipelineName, groupKey);

        if (res.success) {
          setOutcome(t(AnalyticsPipelinesI18nKey.GroupsQueued, { key: groupKey }));
        } else if (res.errorHeader === RUNNER_PIPELINE_NOT_FOUND) {
          setOutcome(t(AnalyticsPipelinesI18nKey.GroupsQueueGone, { key: groupKey }));
        } else {
          showNotification(
            getErrorNotification(t(AnalyticsPipelinesI18nKey.GroupsQueueFailed), res.errorMessage, res.requestId),
          );
        }
      } catch {
        showNotification(getErrorNotification(t(AnalyticsPipelinesI18nKey.GroupsQueueFailed)));
      } finally {
        // The re-read is caught on its own: it must not be the thing that leaves the controls disabled.
        try {
          await onQueued();
        } catch {
          // The listing failed to refresh; the hook that owns it reports that in its own state.
        }

        setIsBusy(false);
      }
    },
    [isBusy, pipelineName, onQueued, showNotification, t],
  );

  return useMemo(() => ({ isBusy, outcome, queue }), [isBusy, outcome, queue]);
};

'use client';

import { useCallback, useMemo, useState } from 'react';

import { requeueFailure, requeueFailures } from '@/src/app/[lang]/pipelines/actions';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DlqRequeueResponse } from '@/src/models/analytics/pipeline-dlq';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

export interface RequeueControls {
  /** A re-run is in flight; every re-run control is non-interactive while one is. */
  isBusy: boolean;
  /** What the last re-run did, for the card's live region. Cleared when the next one starts. */
  outcome: string;
  retryOne: (id: number) => Promise<void>;
  retryMany: (runId: string | undefined, expected: number) => Promise<void>;
}

interface Params {
  pipelineName: string;
  isPaused: boolean;
  onRequeued: () => Promise<void>;
}

/**
 * The three re-runs, and what each one reports.
 *
 * The outcome is a **status message on the card** rather than only a toast: the service re-runs fewer
 * items than it was asked for whenever one of them carries a payload it refuses, and that difference is
 * a fact about the pipeline worth leaving on screen. A failure is a toast, because it is the service's
 * own message with its request id and belongs where every other service failure in the console goes.
 *
 * Every outcome re-reads, success or not. A 404 means the item was already re-run — by the retention
 * sweep, or by whoever else has this page open — so the row on screen is gone and the listing is the
 * thing that is wrong; leaving it there invites the same click again.
 */
export const useRequeueFailures = ({ pipelineName, isPaused, onRequeued }: Params): RequeueControls => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isBusy, setIsBusy] = useState(false);
  const [outcome, setOutcome] = useState('');

  const report = useCallback(
    (requeued: number, expected: number) => {
      const shortfall = Math.max(expected - requeued, 0);

      setOutcome(
        [
          t(AnalyticsPipelinesI18nKey.FailuresRequeued, { count: requeued }),
          shortfall ? t(AnalyticsPipelinesI18nKey.FailuresRequeuedShort, { count: shortfall }) : null,
          isPaused ? t(AnalyticsPipelinesI18nKey.FailuresRetryWhilePaused) : null,
        ]
          .filter(Boolean)
          .join(' '),
      );
    },
    [t, isPaused],
  );

  const run = useCallback(
    async (act: () => Promise<ServerActionResponse<DlqRequeueResponse>>, expected: number) => {
      if (isBusy) return;

      setIsBusy(true);
      setOutcome('');

      try {
        const res = await act();

        if (res.success) {
          report(res.response?.requeued ?? expected, expected);
        } else {
          showNotification(
            getErrorNotification(t(AnalyticsPipelinesI18nKey.FailuresRetryFailed), res.errorMessage, res.requestId),
          );
        }
      } catch {
        // A transport failure rejects rather than resolving. Reported as the service's own failures are,
        // so the operator is not left watching a control that silently did nothing.
        showNotification(getErrorNotification(t(AnalyticsPipelinesI18nKey.FailuresRetryFailed)));
      } finally {
        // In a `finally` because every path above must release the controls — a throw that skipped it
        // left every Retry button on the card disabled until the page was remounted. The re-read is
        // caught separately for the same reason: it must not be the thing that strands them.
        try {
          await onRequeued();
        } catch {
          // The listing failed to refresh; the hook that owns it reports that in its own state.
        }

        setIsBusy(false);
      }
    },
    [isBusy, report, onRequeued, showNotification, t],
  );

  const retryOne = useCallback((id: number) => run(() => requeueFailure(id), 1), [run]);

  const retryMany = useCallback(
    (runId: string | undefined, expected: number) => run(() => requeueFailures(pipelineName, runId), expected),
    [run, pipelineName],
  );

  // One object per state rather than per render: the card memoizes its handlers on this value, and a
  // fresh identity on every render undoes every memo downstream of it.
  return useMemo(() => ({ isBusy, outcome, retryOne, retryMany }), [isBusy, outcome, retryOne, retryMany]);
};

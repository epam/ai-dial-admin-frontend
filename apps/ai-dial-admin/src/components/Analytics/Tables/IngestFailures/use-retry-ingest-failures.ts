'use client';

import { useCallback, useMemo, useState } from 'react';

import { listIngestFailures, retryIngestFailures } from '@/src/app/[lang]/tables/actions';
import { IngestFailureGroup, RetryOutcomeNote } from '@/src/components/Analytics/Tables/IngestFailures/models';
import { retryOutcomeNote } from '@/src/components/Analytics/Tables/IngestFailures/utils';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import {
  IngestFailureRetryRequest,
  IngestFailureState,
  IngestFailureTarget,
  IngestRetrySweep,
} from '@/src/models/analytics/ingest-failure';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification } from '@/src/utils/notification';

export interface IngestRetryControls {
  isBusy: boolean;
  outcome: string;
  retryTargets: (targets: IngestFailureTarget[]) => Promise<void>;
  retryGroup: (group: IngestFailureGroup) => Promise<void>;
  readGroupCount: (group: IngestFailureGroup) => Promise<number | null>;
}

interface Params {
  backfillRunId?: string;
  onRetried: () => Promise<void>;
}

const groupFilter = (group: IngestFailureGroup, backfillRunId?: string): IngestFailureRetryRequest => ({
  state: IngestFailureState.Parked,
  reason: group.reason,
  kind: group.kind,
  ...(backfillRunId ? { backfill_run_id: backfillRunId } : {}),
});

export const useRetryIngestFailures = ({ backfillRunId, onRetried }: Params): IngestRetryControls => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isBusy, setIsBusy] = useState(false);
  const [outcome, setOutcome] = useState('');

  const describe = useCallback(
    (requeued: number, sweep?: IngestRetrySweep): string => {
      if (requeued === 0) return t(IngestFailuresI18nKey.NothingToQueue);

      const time = formatDateTimeToLocalString(sweep?.next_sweep_at);
      const notes: Record<RetryOutcomeNote, string> = {
        [RetryOutcomeNote.NextPass]: t(IngestFailuresI18nKey.NoteNextPass, { time }),
        [RetryOutcomeNote.SeveralPasses]: t(IngestFailuresI18nKey.NoteSeveralPasses, { time }),
        [RetryOutcomeNote.SeveralPassesUntimed]: t(IngestFailuresI18nKey.NoteSeveralPassesUntimed),
        [RetryOutcomeNote.SweepOff]: t(IngestFailuresI18nKey.NoteSweepOff),
      };
      const note = retryOutcomeNote(requeued, sweep);

      return [t(IngestFailuresI18nKey.Queued, { count: requeued }), note ? notes[note] : null]
        .filter(Boolean)
        .join(' ');
    },
    [t],
  );

  const send = useCallback(
    async (body: IngestFailureRetryRequest) => {
      if (isBusy) return;

      setIsBusy(true);
      setOutcome('');

      try {
        const res = await retryIngestFailures(body);

        if (res.success && res.response) {
          setOutcome(describe(res.response.requeued, res.response.retry_sweep));
        } else {
          showNotification(getErrorNotification(t(IngestFailuresI18nKey.RetryFailed), res.errorMessage, res.requestId));
        }
      } catch {
        showNotification(getErrorNotification(t(IngestFailuresI18nKey.RetryFailed)));
      } finally {
        try {
          await onRetried();
        } catch {
          // The read hook reports its own failure.
        }

        setIsBusy(false);
      }
    },
    [isBusy, describe, onRetried, showNotification, t],
  );

  const retryTargets = useCallback((targets: IngestFailureTarget[]) => send({ targets }), [send]);

  const retryGroup = useCallback(
    (group: IngestFailureGroup) => send(groupFilter(group, backfillRunId)),
    [send, backfillRunId],
  );

  const readGroupCount = useCallback(
    async (group: IngestFailureGroup): Promise<number | null> => {
      try {
        const res = await listIngestFailures({
          state: IngestFailureState.Parked,
          reason: group.reason,
          kind: group.kind,
          backfill_run_id: backfillRunId,
          limit: 1,
        });

        return res.success && typeof res.response?.total === 'number' ? res.response.total : null;
      } catch {
        return null;
      }
    },
    [backfillRunId],
  );

  return useMemo(
    () => ({ isBusy, outcome, retryTargets, retryGroup, readGroupCount }),
    [isBusy, outcome, retryTargets, retryGroup, readGroupCount],
  );
};

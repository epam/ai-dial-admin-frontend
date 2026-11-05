'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listIngestFailures } from '@/src/app/[lang]/tables/actions';
import { INGEST_FAILURES_LIMIT } from '@/src/components/Analytics/Tables/IngestFailures/constants';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';
import { useI18n } from '@/src/locales/client';
import {
  IngestFailure,
  IngestFailureByState,
  IngestFailureList,
  IngestFailureState,
  IngestRetrySweep,
} from '@/src/models/analytics/ingest-failure';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

const NO_COUNTS: IngestFailureByState = { pending: 0, parked: 0 };

export interface IngestFailuresRead {
  parked: IngestFailure[];
  pending: IngestFailure[];
  byState: IngestFailureByState;
  retrySweep?: IngestRetrySweep;
  hasAnswered: boolean;
  isLoading: boolean;
  hasFailed: boolean;
  isUnavailable: boolean;
  reload: () => Promise<void>;
}

const isNotServed = (res: ServerActionResponse | null): boolean => res?.status === 404;

const readState = async (
  state: IngestFailureState,
  backfillRunId?: string,
): Promise<ServerActionResponse<IngestFailureList> | null> => {
  try {
    return await listIngestFailures({ state, backfill_run_id: backfillRunId, limit: INGEST_FAILURES_LIMIT });
  } catch {
    return null;
  }
};

export const useIngestFailures = (backfillRunId?: string): IngestFailuresRead => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const guard = useGuardedRead();

  const [parked, setParked] = useState<IngestFailure[]>([]);
  const [pending, setPending] = useState<IngestFailure[]>([]);
  const [byState, setByState] = useState<IngestFailureByState>(NO_COUNTS);
  const [retrySweep, setRetrySweep] = useState<IngestRetrySweep | undefined>(undefined);
  const [answeredFor, setAnsweredFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);

    const answer = await guard.run(() =>
      Promise.all([
        readState(IngestFailureState.Parked, backfillRunId),
        readState(IngestFailureState.Pending, backfillRunId),
      ]),
    );

    if (!answer) return;

    const [parkedRes, pendingRes] = answer;
    setIsLoading(false);

    if (isNotServed(parkedRes) || isNotServed(pendingRes)) {
      setIsUnavailable(true);
      setHasFailed(false);
      return;
    }

    if (!parkedRes?.success || !parkedRes.response || !pendingRes?.success || !pendingRes.response) {
      const failed = parkedRes?.success ? pendingRes : parkedRes;
      setHasFailed(true);
      setParked([]);
      setPending([]);
      setByState(NO_COUNTS);
      showNotification(
        getErrorNotification(t(IngestFailuresI18nKey.ReadFailed), failed?.errorMessage, failed?.requestId),
      );
      return;
    }

    setIsUnavailable(false);
    setHasFailed(false);
    setAnsweredFor(backfillRunId ?? '');
    setParked(parkedRes.response.failures);
    setPending(pendingRes.response.failures);
    setByState(parkedRes.response.by_state ?? NO_COUNTS);
    setRetrySweep(parkedRes.response.retry_sweep);
  }, [guard, backfillRunId, showNotification, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const hasAnswered = answeredFor === (backfillRunId ?? '');

  return useMemo(
    () => ({ parked, pending, byState, retrySweep, hasAnswered, isLoading, hasFailed, isUnavailable, reload }),
    [parked, pending, byState, retrySweep, hasAnswered, isLoading, hasFailed, isUnavailable, reload],
  );
};

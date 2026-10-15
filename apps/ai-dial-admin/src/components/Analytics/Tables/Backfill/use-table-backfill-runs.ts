'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { listTableBackfillRuns, startTableBackfill } from '@/src/app/[lang]/tables/actions';
import { BACKFILL_POLL_INTERVAL_MS } from '@/src/constants/analytics/backfill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';
import { usePolledRead } from '@/src/hooks/use-polled-read';
import { useI18n } from '@/src/locales/client';
import { TableBackfillRun, TableBackfillState } from '@/src/models/analytics/table-backfill';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

const isRunning = (run: TableBackfillRun): boolean => run.state === TableBackfillState.Running;

export const findRunningTableBackfill = (runs: TableBackfillRun[]): TableBackfillRun | undefined =>
  runs.find(isRunning);

interface Result {
  runs: TableBackfillRun[];
  isStarting: boolean;
  start: (from: string, to: string, shouldIncludeIngested: boolean) => Promise<boolean>;
}

/**
 * The ingest service's retained runs, read when the drawer opens and every few seconds while one is running. One
 * list call refreshes the run, the list and the banner together.
 */
export const useTableBackfillRuns = (onRunsChange: (runs: TableBackfillRun[]) => void): Result => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const guarded = useGuardedRead();

  const [runs, setRuns] = useState<TableBackfillRun[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const onRunsChangeRef = useRef(onRunsChange);
  onRunsChangeRef.current = onRunsChange;

  const apply = useCallback((next: TableBackfillRun[]) => {
    setRuns(next);
    onRunsChangeRef.current(next);
  }, []);

  const reload = useCallback(async () => {
    const res = await guarded.run(() => listTableBackfillRuns());

    if (!res) return;

    if (res.success) {
      apply(res.response ?? []);
      return;
    }

    showNotification(
      getErrorNotification(res.errorHeader || t(BackfillI18nKey.ReadFailed), res.errorMessage, res.requestId),
    );
  }, [apply, guarded, showNotification, t]);

  useEffect(() => {
    void reload();
    // Once, on open. `reload` changes identity with the notification context, which must not re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readRuns = useCallback(async () => {
    const res = await listTableBackfillRuns();

    return res.success ? (res.response ?? []) : null;
  }, []);

  usePolledRead({
    read: readRuns,
    onResult: apply,
    isTerminal: (next) => !findRunningTableBackfill(next),
    intervalMs: BACKFILL_POLL_INTERVAL_MS,
    isEnabled: Boolean(findRunningTableBackfill(runs)),
  });

  const start = useCallback(
    async (from: string, to: string, shouldIncludeIngested: boolean): Promise<boolean> => {
      setIsStarting(true);

      try {
        const res = await startTableBackfill(from, to, shouldIncludeIngested);

        if (!res.success) {
          showNotification(
            getErrorNotification(res.errorHeader || t(BackfillI18nKey.StartFailed), res.errorMessage, res.requestId),
          );
          return false;
        }

        showNotification(getSuccessNotification(t(BackfillI18nKey.Started)));
        await reload();
        return true;
      } finally {
        setIsStarting(false);
      }
    },
    [reload, showNotification, t],
  );

  return { runs, isStarting, start };
};

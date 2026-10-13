'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelPipelineBackfill,
  listPipelineBackfills,
  pausePipelineBackfill,
  resumePipelineBackfill,
  startPipelineBackfill,
} from '@/src/app/[lang]/pipelines/actions';
import { BACKFILL_POLL_INTERVAL_MS, PIPELINE_BACKFILL_LIST_LIMIT } from '@/src/constants/analytics/backfill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';
import { usePolledRead } from '@/src/hooks/use-polled-read';
import { useI18n } from '@/src/locales/client';
import {
  PipelineBackfillRequest,
  PipelineBackfillRun,
  PipelineBackfillState,
  PipelineBackfillVerb,
} from '@/src/models/analytics/pipeline-backfill';
import { ServerActionResponse } from '@/src/models/server-action';
import { isPipelineBackfillActive } from '@/src/utils/analytics/backfill';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

export const findRunningPipelineBackfill = (runs: PipelineBackfillRun[]): PipelineBackfillRun | undefined =>
  runs.find((run) => run.state === PipelineBackfillState.Running);

/** The run that holds the pipeline: running or paused. At most one is running; paused ones may be several. */
export const findActivePipelineBackfill = (runs: PipelineBackfillRun[]): PipelineBackfillRun | undefined =>
  findRunningPipelineBackfill(runs) ?? runs.find(isPipelineBackfillActive);

interface Params {
  pipelineName: string;
  /** Called with every answer, so the banner above the tab strip stays current while the sidebar is open. */
  onRunsChange: (runs: PipelineBackfillRun[]) => void;
}

interface Result {
  runs: PipelineBackfillRun[];
  isBusy: boolean;
  reload: () => Promise<void>;
  start: (window?: PipelineBackfillRequest) => Promise<boolean>;
  applyVerb: (verb: PipelineBackfillVerb, runId: string) => Promise<void>;
}

/**
 * One pipeline's latest runs, read when the drawer opens and every few seconds while one is running, and the three
 * verbs a run takes. The runs are read again after every verb, success or not: a refusal means the run on screen is
 * no longer the run the service holds.
 */
export const usePipelineBackfillRuns = ({ pipelineName, onRunsChange }: Params): Result => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const guarded = useGuardedRead();

  const [runs, setRuns] = useState<PipelineBackfillRun[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const onRunsChangeRef = useRef(onRunsChange);
  onRunsChangeRef.current = onRunsChange;

  const apply = useCallback((next: PipelineBackfillRun[]) => {
    setRuns(next);
    onRunsChangeRef.current(next);
  }, []);

  const reload = useCallback(async () => {
    const res = await guarded.run(() => listPipelineBackfills(pipelineName, PIPELINE_BACKFILL_LIST_LIMIT));

    if (!res) return;

    if (res.success) {
      apply(res.response ?? []);
      return;
    }

    showNotification(
      getErrorNotification(res.errorHeader || t(BackfillI18nKey.ReadFailed), res.errorMessage, res.requestId),
    );
  }, [apply, guarded, pipelineName, showNotification, t]);

  useEffect(() => {
    void reload();
    // Once, on open. `reload` changes identity with the notification context, which must not re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readRuns = useCallback(async () => {
    const res = await listPipelineBackfills(pipelineName, PIPELINE_BACKFILL_LIST_LIMIT);

    return res.success ? (res.response ?? []) : null;
  }, [pipelineName]);

  usePolledRead({
    read: readRuns,
    onResult: apply,
    isTerminal: (next) => !findRunningPipelineBackfill(next),
    intervalMs: BACKFILL_POLL_INTERVAL_MS,
    isEnabled: Boolean(findRunningPipelineBackfill(runs)),
  });

  const report = useCallback(
    (res: ServerActionResponse, failureKey: BackfillI18nKey, successKey?: BackfillI18nKey): boolean => {
      if (res.success) {
        if (successKey) showNotification(getSuccessNotification(t(successKey)));
        return true;
      }

      showNotification(getErrorNotification(res.errorHeader || t(failureKey), res.errorMessage, res.requestId));
      return false;
    },
    [showNotification, t],
  );

  const start = useCallback(
    async (window?: PipelineBackfillRequest): Promise<boolean> => {
      setIsBusy(true);

      try {
        const isStarted = report(
          await startPipelineBackfill(pipelineName, window),
          BackfillI18nKey.StartFailed,
          BackfillI18nKey.Started,
        );

        if (isStarted) await reload();

        return isStarted;
      } finally {
        setIsBusy(false);
      }
    },
    [pipelineName, reload, report],
  );

  const applyVerb = useCallback(
    async (verb: PipelineBackfillVerb, runId: string) => {
      setIsBusy(true);

      const act = {
        [PipelineBackfillVerb.Pause]: () => pausePipelineBackfill(runId),
        [PipelineBackfillVerb.Resume]: () => resumePipelineBackfill(runId),
        [PipelineBackfillVerb.Cancel]: () => cancelPipelineBackfill(runId),
      }[verb];
      const done = {
        [PipelineBackfillVerb.Pause]: BackfillI18nKey.Paused,
        [PipelineBackfillVerb.Resume]: BackfillI18nKey.Resumed,
        [PipelineBackfillVerb.Cancel]: BackfillI18nKey.Cancelled,
      }[verb];

      try {
        report(await act(), BackfillI18nKey.ActionFailed, done);
        await reload();
      } finally {
        setIsBusy(false);
      }
    },
    [reload, report],
  );

  return { runs, isBusy, reload, start, applyVerb };
};

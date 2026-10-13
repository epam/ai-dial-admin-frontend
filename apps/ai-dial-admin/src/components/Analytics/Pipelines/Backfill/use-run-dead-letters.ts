'use client';

import { useCallback, useEffect, useState } from 'react';

import { getPipelineFailures } from '@/src/app/[lang]/pipelines/actions';
import { DLQ_SUMMARY_LIMIT } from '@/src/constants/analytics/pipeline-dlq';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';

interface Result {
  /** How many dead letters this run produced, or null while unknown. */
  total: number | null;
  /** How many of them carry a payload and can be re-run. */
  requeueable: number;
  reload: () => Promise<void>;
}

/**
 * The dead letters of one run, counted by the dead-letter listing narrowed to the run (the run carries no such
 * field), with the smallest legal page. Read when a run is presented and when its state changes, not on every poll.
 */
export const useRunDeadLetters = (pipelineName: string, runId: string, state: string): Result => {
  const guarded = useGuardedRead();
  const [total, setTotal] = useState<number | null>(null);
  const [requeueable, setRequeueable] = useState(0);

  const reload = useCallback(async () => {
    const res = await guarded.run(() => getPipelineFailures(pipelineName, { runId }, DLQ_SUMMARY_LIMIT));

    if (!res?.success || !res.response) return;

    setTotal(res.response.total);
    setRequeueable(res.response.requeueable_total);
  }, [guarded, pipelineName, runId]);

  useEffect(() => {
    setTotal(null);
    setRequeueable(0);
    void reload();
  }, [reload, state]);

  return { total, requeueable, reload };
};

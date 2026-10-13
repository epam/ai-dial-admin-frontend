'use client';

import { useCallback, useEffect, useState } from 'react';

import { listPipelineBackfills } from '@/src/app/[lang]/pipelines/actions';
import {
  findActivePipelineBackfill,
  findRunningPipelineBackfill,
} from '@/src/components/Analytics/Pipelines/Backfill/use-pipeline-backfill-runs';
import { BACKFILL_POLL_INTERVAL_MS, PIPELINE_BACKFILL_LIST_LIMIT } from '@/src/constants/analytics/backfill';
import { usePolledRead } from '@/src/hooks/use-polled-read';
import { PipelineBackfillRun, PipelineBackfillState } from '@/src/models/analytics/pipeline-backfill';

interface Params {
  pipelineName: string;
  /** Whether this caller and this pipeline can have a backfill at all; nothing is read or offered otherwise. */
  isAvailable: boolean;
}

interface Result {
  activeRun: PipelineBackfillRun | null;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Handed to the drawer's content, which reports every answer so the banner stays current while it is open. */
  onRunsChange: (runs: PipelineBackfillRun[]) => void;
}

/**
 * What the pipeline page needs besides the drawer: the active run for the banner, and whether the drawer is open.
 * The banner reads on mount and then every few seconds while its run is running and the drawer is closed; while the
 * drawer is open its content reads and hands every answer back, so there is never a second reader.
 */
export const usePipelineBackfillEntry = ({ pipelineName, isAvailable }: Params): Result => {
  const [activeRun, setActiveRun] = useState<PipelineBackfillRun | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const onRunsChange = useCallback((runs: PipelineBackfillRun[]) => {
    setActiveRun(findActivePipelineBackfill(runs) ?? null);
  }, []);

  const readRuns = useCallback(async () => {
    const res = await listPipelineBackfills(pipelineName, PIPELINE_BACKFILL_LIST_LIMIT);

    return res.success ? (res.response ?? []) : null;
  }, [pipelineName]);

  useEffect(() => {
    if (!isAvailable) return;

    void (async () => {
      const runs = await readRuns();
      if (runs) onRunsChange(runs);
    })();
  }, [isAvailable, readRuns, onRunsChange]);

  usePolledRead({
    read: readRuns,
    onResult: onRunsChange,
    isTerminal: (runs) => !findRunningPipelineBackfill(runs),
    intervalMs: BACKFILL_POLL_INTERVAL_MS,
    isEnabled: isAvailable && !isOpen && activeRun?.state === PipelineBackfillState.Running,
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { activeRun: isAvailable ? activeRun : null, isOpen, open, close, onRunsChange };
};

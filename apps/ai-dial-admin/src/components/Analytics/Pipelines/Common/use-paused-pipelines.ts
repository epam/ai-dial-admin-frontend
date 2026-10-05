'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPausedPipelines, getRunnerPipelines } from '@/src/app/[lang]/pipelines/actions';
import { useAppContext } from '@/src/context/AppContext';
import { PipelineKind } from '@/src/models/analytics/pipeline';
import {
  PausedPipeline,
  PipelineRuntimeRead,
  PipelineRuntimeStatus,
  RunnerPipelineEntry,
} from '@/src/models/analytics/pipeline-runtime';

export interface PausedPipelinesRead extends PipelineRuntimeRead {
  /** Re-reads the runner. Called after a pause or a resume, so the page states what the service holds. */
  reload: () => Promise<void>;
}

const NOT_READ: PipelineRuntimeRead = { isRead: false, isTrackingRead: false, paused: {}, tracked: new Set() };

const byName = (entries: PausedPipeline[]): Record<string, PausedPipeline> =>
  Object.fromEntries(entries.map((entry) => [entry.pipelineName, entry]));

const names = (entries: RunnerPipelineEntry[]): Set<string> => new Set(entries.map((entry) => entry.name));

/**
 * Whether this pipeline is the runner's to drive at all.
 *
 * Only an `enrich` pipeline is. The runner refuses anything without a `transform` and a grain key, and
 * an `aggregate` pipeline has neither — ADAS runs those itself, on its own cron, which is why they
 * report `next_run_at` while being absent from the runner's cache. Reading that absence as a fault
 * flagged every healthy rollup on the page as "nothing is running this pipeline".
 *
 * A pause is the same story from the other side: the runner would accept one for an aggregate pipeline
 * and answer 204, but only its own executors consult the pause registry, so nothing would stop.
 */
export const isRunnerDriven = (kind: PipelineKind): boolean => kind === PipelineKind.Enrich;

/**
 * What the console can state about one pipeline, given both reads.
 *
 * `Running` means the runner has taken the pipeline on and schedules its fires — not that rows are
 * moving through it this second, which neither service reports. `NotTracked` is the case worth
 * surfacing: the pipeline is enabled and the runner's to drive, so the registry presents it as healthy
 * while nothing is driving it — the runner either refused the declaration or has not synced yet.
 */
export const runtimeStatusOf = (
  read: PipelineRuntimeRead,
  name: string,
  isEnabled: boolean,
  kind: PipelineKind,
): PipelineRuntimeStatus => {
  if (!read.isRead || !isEnabled || !isRunnerDriven(kind)) return PipelineRuntimeStatus.Unknown;
  if (read.paused[name]) return PipelineRuntimeStatus.Paused;
  // Without the cache listing the two remaining states are indistinguishable, so the console keeps the
  // one it can act on: `running` still offers a pause, where `not running` would withhold it on a guess.
  if (!read.isTrackingRead) return PipelineRuntimeStatus.Running;
  return read.tracked.has(name) ? PipelineRuntimeStatus.Running : PipelineRuntimeStatus.NotTracked;
};

/**
 * Reads the enrichment runner — which pipelines it has taken on, and which of those are paused — once
 * per mount and again on demand.
 *
 * It reads on the client rather than in the page's server component because the runner authorizes every
 * endpoint on full-admin rights and the console only knows who the caller is here: `isFullAdmin` is
 * derived in `AppContext` from the session. A server-side read would issue a request for every caller and
 * let the runner refuse it, putting a 403 in the log of every read-only admin who opens a pipeline.
 *
 * The two reads fail independently. The pauses are the load-bearing one — without them nothing runtime
 * is stated at all. The cache listing only adds the third state, `not running`; where it is missing the
 * console keeps `running` and its pause rather than withholding both on a guess, which is what a
 * deployment whose runner does not serve that route would otherwise get.
 *
 * A failed read and an unconfigured runner are the same answer — `isRead: false`, nothing known. Neither
 * supports stating a pipeline's runtime, and the caller withholds the chip, the banner and the column
 * rather than guessing.
 */
export const usePausedPipelines = (): PausedPipelinesRead => {
  const { isFullAdmin } = useAppContext();

  const [read, setRead] = useState<PipelineRuntimeRead>(NOT_READ);
  const isMounted = useRef(true);
  const latestRequest = useRef(0);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!isFullAdmin) return;

    // Only the newest read may write. A Read-again and the re-read a resume triggers can land out of
    // order, and the loser would leave the page stating the answer from before the pipeline changed.
    const request = ++latestRequest.current;

    const [paused, tracked] = await Promise.all([getPausedPipelines(), getRunnerPipelines()]);

    if (!isMounted.current || request !== latestRequest.current) return;

    const isRead = Boolean(paused?.success && paused.response);
    const isTrackingRead = Boolean(tracked?.success && tracked.response);

    setRead(
      isRead
        ? {
            isRead: true,
            isTrackingRead,
            paused: byName(paused.response as PausedPipeline[]),
            tracked: isTrackingRead ? names(tracked.response as RunnerPipelineEntry[]) : new Set<string>(),
          }
        : NOT_READ,
    );
  }, [isFullAdmin]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // One object per answer rather than per render: the listing memoizes its column definitions on this
  // value, and a fresh identity per render handed AG Grid a new column array on every keystroke.
  return useMemo(() => ({ ...read, reload }), [read, reload]);
};

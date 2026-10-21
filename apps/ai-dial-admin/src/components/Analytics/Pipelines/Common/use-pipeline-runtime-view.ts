'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getPipelineRuntimeView } from '@/src/app/[lang]/pipelines/actions';
import { useAppContext } from '@/src/context/AppContext';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';
import {
  PipelineRuntimeView,
  RUNNER_CACHE_COLD,
  RUNNER_NOT_CONFIGURED,
  RUNNER_PIPELINE_NOT_FOUND,
  RuntimeReadOutcome,
} from '@/src/models/analytics/pipeline-runtime';
import { ServerActionResponse } from '@/src/models/server-action';

/**
 * One pipeline's runtime, and which of the service's answers produced it.
 *
 * The outcome is a single value rather than a set of booleans: the reader states exactly one thing, and
 * as flags the three that mean "no view" were indistinguishable from each other and from not having
 * asked yet.
 */
export interface PipelineRuntimeViewRead {
  outcome: RuntimeReadOutcome;
  /** Present exactly when the outcome is `Read`. */
  view?: PipelineRuntimeView;
  /** The service's own words for a refusal, where it sent any. */
  errorMessage?: string;
  /** The trace id of the refused request, so a reported failure can be found in the service's log. */
  requestId?: string;
  reload: () => Promise<void>;
}

type Answer = Pick<PipelineRuntimeViewRead, 'outcome' | 'view' | 'errorMessage' | 'requestId'>;

const PENDING: Answer = { outcome: RuntimeReadOutcome.Pending };
const UNAVAILABLE: Answer = { outcome: RuntimeReadOutcome.Unavailable };

/** Which answer this response is. Keyed on the service's own codes, not on a status number. */
const answerOf = (res: ServerActionResponse<PipelineRuntimeView> | null): Answer => {
  if (res?.success && res.response) return { outcome: RuntimeReadOutcome.Read, view: res.response };

  const failure = { errorMessage: res?.errorMessage, requestId: res?.requestId };

  switch (res?.errorHeader) {
    case RUNNER_NOT_CONFIGURED:
      return UNAVAILABLE;
    case RUNNER_CACHE_COLD:
      return { outcome: RuntimeReadOutcome.Cold };
    case RUNNER_PIPELINE_NOT_FOUND:
      return { outcome: RuntimeReadOutcome.NotHeld };
    default:
      return { outcome: RuntimeReadOutcome.Failed, ...failure };
  }
};

/**
 * What the runner is doing with one pipeline, read once per mount and again on demand.
 *
 * Read on the client for the same reason the pauses are: the service authorizes every endpoint on
 * full-admin rights, and only the client knows who the caller is. A server-side read would issue a
 * request for every caller and let the service refuse it, putting a 403 in the log of every read-only
 * admin who opens a pipeline.
 *
 * This is the detail page's **single** runner read. It states the pipeline's state directly, including
 * the pause, where the page previously looked itself up in two global listings. The listing page keeps
 * those listings: they answer about every pipeline in two requests, and one view per row is not a trade
 * a grid makes.
 *
 * The caller decides whether there is anything to ask about — the kind the runner drives, and the
 * feature flag. The rights are read here, from the same context the rest of the runtime surface reads
 * them from.
 */
export const usePipelineRuntimeView = (name: string, isAsked: boolean): PipelineRuntimeViewRead => {
  const { isFullAdmin } = useAppContext();
  const guard = useGuardedRead();

  // Pending until something is known. Starting at "unavailable" made the first paint of every pipeline
  // indistinguishable from a deployment with no runner, and the tab stated a verdict on the strength of
  // it before the request had left.
  const [answer, setAnswer] = useState<Answer>(PENDING);

  const canAsk = isFullAdmin && isAsked;

  const reload = useCallback(async () => {
    if (!canAsk) {
      // Cancelled, not merely skipped: a read issued while the caller still had the rights would
      // otherwise land afterwards and put the runner's answer back on a page that may no longer ask.
      guard.cancel();
      setAnswer(UNAVAILABLE);
      return;
    }

    // A transport failure rejects rather than resolving, so it is caught here and answered as a read
    // that did not answer — one shape for every caller, and nothing escapes as an unhandled rejection.
    //
    // `await` in a try rather than `.catch()` on the returned value, which is what the repo's own
    // standard asks for and is also the sturdier of the two: a `.catch()` presumes the call returned a
    // promise, and a spec that automocks this module hands back `undefined`, which throws on the spot.
    // The `?? null` keeps that case distinguishable from the guard's own `undefined` for a stale read.
    const res = await guard.run(async () => {
      try {
        return (await getPipelineRuntimeView(name)) ?? null;
      } catch {
        return null;
      }
    });

    // `undefined` is the guard saying this answer is stale or the component is gone.
    if (res === undefined) return;

    setAnswer(answerOf(res));
  }, [canAsk, name, guard]);

  // Dropped when the pipeline changes, not when its answer arrives. The detail frame is reused across
  // a client-side navigation between two pipelines, so without this the new page states the previous
  // pipeline's chip, banner and cards for one round-trip — and its Resume would act on the new one.
  useEffect(() => {
    setAnswer(PENDING);
  }, [name]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(() => ({ ...answer, reload }), [answer, reload]);
};

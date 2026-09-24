'use client';

import { useEffect, useState } from 'react';

import { getRunCosts } from '@/src/app/[lang]/runs/actions';
import { COST_ELAPSED_TICK_MS, COST_FETCH_POLL_INTERVAL_MS } from '@/src/components/Runs/Summary/constants';
import { hasRunCostFigure } from '@/src/components/Runs/Summary/utils';
import { RunCosts } from '@/src/models/evaluation/run';

export interface UseRunCostsResult {
  costs: RunCosts | null;
  isPending: boolean;
  unavailable: boolean;
  elapsedMs: number;
}

/**
 * Fetches run costs independently of the analytics structured-query slice so
 * dial-adas failures do not blank the rest of the Summary KPI strip.
 *
 * The endpoint answers as soon as the run row exists, but the backend aggregates usage logs
 * asynchronously, so a just-finished run gets an empty body or all-null averages back within
 * milliseconds. That is "not computed yet", not a result: the hook keeps polling on
 * `COST_FETCH_POLL_INTERVAL_MS` and stays pending for as long as the cards are mounted. Only a real
 * figure or an endpoint error (null response or throw) settles the cards — there is no client-side
 * deadline, because a long aggregation is slow, not broken, and an Error badge over data that is
 * still on its way is worse than a spinner the user can walk away from.
 *
 * Because that wait is unbounded, the caller must say whether this run can produce a cost at all:
 * `canHaveCosts` false skips the fetch entirely and reports idle, so a run that will never have
 * figures shows a dash instead of spinning forever. The caller owns that judgement because the
 * evidence for it — run status, result counts, suite type, metric snapshots — lives on the Summary
 * tab, not behind `/costs`.
 */
export const useRunCosts = (runId: string | undefined, canHaveCosts = true): UseRunCostsResult => {
  const [costs, setCosts] = useState<RunCosts | null>(null);
  /** True whenever a fetch is due until the first effect flush — avoids an idle frame that paints as "—". */
  const [isPending, setIsPending] = useState(() => Boolean(runId) && canHaveCosts);
  const [unavailable, setUnavailable] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!runId || !canHaveCosts) {
      setCosts(null);
      setIsPending(false);
      setUnavailable(false);
      setElapsedMs(0);
      return;
    }

    let cancelled = false;
    /** True once a definitive outcome (figures / null / throw) has been applied. */
    let hasSettled = false;
    let retryId = 0;
    const startedAt = Date.now();

    setCosts(null);
    setIsPending(true);
    setUnavailable(false);
    setElapsedMs(0);

    const tickId = window.setInterval(() => {
      if (!cancelled && !hasSettled) {
        setElapsedMs(Date.now() - startedAt);
      }
    }, COST_ELAPSED_TICK_MS);

    const stopTimers = () => {
      window.clearInterval(tickId);
      window.clearTimeout(retryId);
    };

    const settle = (result: RunCosts | null) => {
      hasSettled = true;
      stopTimers();
      setElapsedMs(Date.now() - startedAt);
      setCosts(result);
      setUnavailable(result == null);
      setIsPending(false);
    };

    const attempt = async () => {
      try {
        const result = await getRunCosts(runId);
        if (cancelled || hasSettled) {
          return;
        }
        if (result == null || hasRunCostFigure(result)) {
          settle(result);
          return;
        }
        // Costs are not aggregated yet — keep the calculating state and ask again.
        retryId = window.setTimeout(() => void attempt(), COST_FETCH_POLL_INTERVAL_MS);
      } catch {
        if (cancelled || hasSettled) {
          return;
        }
        settle(null);
      }
    };

    void attempt();

    return () => {
      cancelled = true;
      stopTimers();
    };
  }, [runId, canHaveCosts]);

  return { costs, isPending, unavailable, elapsedMs };
};

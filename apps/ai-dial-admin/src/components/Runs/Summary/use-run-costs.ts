'use client';

import { useEffect, useState } from 'react';

import { getRunCosts } from '@/src/app/[lang]/runs/actions';
import { COST_FETCH_TIMEOUT_MS } from '@/src/components/Runs/Summary/constants';
import { RunCosts } from '@/src/models/evaluation/run';

export interface UseRunCostsResult {
  costs: RunCosts | null;
  isLoading: boolean;
  unavailable: boolean;
  /** Milliseconds since the current fetch started; 0 when idle. */
  elapsedMs: number;
}

/**
 * Fetches run costs independently of the analytics structured-query slice so
 * dial-adas failures do not blank the rest of the Summary KPI strip.
 * Tracks elapsed time for the calculating UI and soft-times out after
 * `COST_FETCH_TIMEOUT_MS` without aborting the in-flight request — a late
 * success still replaces the Error state.
 */
export const useRunCosts = (runId: string | undefined): UseRunCostsResult => {
  const [costs, setCosts] = useState<RunCosts | null>(null);
  /** True whenever a runId is present until the first effect flush — avoids an idle frame that paints as "—". */
  const [isLoading, setIsLoading] = useState(() => Boolean(runId));
  const [unavailable, setUnavailable] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!runId) {
      setCosts(null);
      setIsLoading(false);
      setUnavailable(false);
      setElapsedMs(0);
      return;
    }

    let cancelled = false;
    /** True once a definitive result (success / null / throw) has been applied — not the soft timeout. */
    let hasResult = false;
    let timedOut = false;
    const startedAt = Date.now();

    setCosts(null);
    setIsLoading(true);
    setUnavailable(false);
    setElapsedMs(0);

    const tickId = window.setInterval(() => {
      if (!cancelled && !hasResult && !timedOut) {
        setElapsedMs(Date.now() - startedAt);
      }
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      if (cancelled || hasResult) {
        return;
      }
      timedOut = true;
      setElapsedMs(Date.now() - startedAt);
      setIsLoading(false);
      setUnavailable(true);
      window.clearInterval(tickId);
    }, COST_FETCH_TIMEOUT_MS);

    getRunCosts(runId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        hasResult = true;
        window.clearTimeout(timeoutId);
        window.clearInterval(tickId);
        setElapsedMs(Date.now() - startedAt);
        if (result == null) {
          setCosts(null);
          setUnavailable(true);
          return;
        }
        setCosts(result);
        setUnavailable(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        hasResult = true;
        window.clearTimeout(timeoutId);
        window.clearInterval(tickId);
        setElapsedMs(Date.now() - startedAt);
        setCosts(null);
        setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(tickId);
    };
  }, [runId]);

  return { costs, isLoading, unavailable, elapsedMs };
};

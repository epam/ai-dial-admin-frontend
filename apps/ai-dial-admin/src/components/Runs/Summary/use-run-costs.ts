'use client';

import { useEffect, useState } from 'react';

import { getRunCosts } from '@/src/app/[lang]/runs/actions';
import { RunCosts } from '@/src/models/evaluation/run';

export interface UseRunCostsResult {
  costs: RunCosts | null;
  isLoading: boolean;
  unavailable: boolean;
}

/**
 * Fetches run costs independently of the analytics structured-query slice so
 * dial-adas failures do not blank the rest of the Summary KPI strip.
 */
export const useRunCosts = (runId: string | undefined): UseRunCostsResult => {
  const [costs, setCosts] = useState<RunCosts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!runId) {
      setCosts(null);
      setIsLoading(false);
      setUnavailable(false);
      return;
    }

    let cancelled = false;
    setCosts(null);
    setIsLoading(true);
    setUnavailable(false);

    getRunCosts(runId)
      .then((result) => {
        if (cancelled) {
          return;
        }
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
    };
  }, [runId]);

  return { costs, isLoading, unavailable };
};

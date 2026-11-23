'use client';

import { useEffect, useMemo, useState } from 'react';

import { executeStructuredQueries } from '@/src/app/[lang]/runs/actions';
import { buildMonthCostWindows, MonthCostWindows } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import {
  ActivityCardModel,
  ActivityQueries,
  ActivityResults,
  CoverageSource,
  CoverageStatus,
} from '@/src/components/EvalSystemHealth/models';
import { useStartOfToday } from '@/src/components/EvalSystemHealth/use-start-of-today';
import { buildActivityCards } from '@/src/components/EvalSystemHealth/utils/build-activity-cards';
import { buildActivityQueries } from '@/src/components/EvalSystemHealth/utils/build-activity-queries';

interface ActivityData {
  cards: ActivityCardModel[];
  /** The current and previous spans the cards count over, with their display labels. */
  windows: MonthCostWindows;
}

const LOADING: CoverageSource<ActivityResults> = { status: CoverageStatus.Loading };
const FAILED: CoverageSource<ActivityResults> = { status: CoverageStatus.Error };

/** Never rejects: a batch that cannot be read at all is reported as failed. */
const loadActivityResults = async (queries: ActivityQueries): Promise<CoverageSource<ActivityResults>> => {
  const keys = Object.keys(queries) as (keyof ActivityQueries)[];
  try {
    const results = await executeStructuredQueries(keys.map((key) => queries[key]));
    const value = Object.fromEntries(keys.map((key, index) => [key, results[index] ?? null])) as ActivityResults;
    return { status: CoverageStatus.Ready, value };
  } catch {
    return FAILED;
  }
};

/**
 * Loads the activity queries as one batch and returns the two cards with the periods they cover. The periods
 * follow the calendar: when the day rolls over while the page is open, the figures are loaded again.
 */
export const useActivityData = (): ActivityData => {
  const startOfToday = useStartOfToday();
  const windows = useMemo(() => buildMonthCostWindows(new Date(startOfToday)), [startOfToday]);
  const [source, setSource] = useState<CoverageSource<ActivityResults>>(LOADING);

  useEffect(() => {
    let isCancelled = false;

    setSource(LOADING);
    const load = async () => {
      const loaded = await loadActivityResults(buildActivityQueries(windows));
      if (!isCancelled) {
        setSource(loaded);
      }
    };
    void load();

    return () => {
      isCancelled = true;
    };
  }, [windows]);

  const cards = useMemo(() => buildActivityCards(source), [source]);
  return { cards, windows };
};

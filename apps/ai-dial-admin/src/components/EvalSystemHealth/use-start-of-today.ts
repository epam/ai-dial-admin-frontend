'use client';

import { useEffect, useState } from 'react';

import { DAY_ROLLOVER_BUFFER_MS } from '@/src/components/EvalSystemHealth/constants';
import { msUntilNextLocalDay, startOfLocalDay } from '@/src/components/EvalSystemHealth/utils/local-day';

/**
 * The first instant of the local calendar day, in epoch milliseconds, updated when the day rolls over, so a
 * page left open across midnight re-derives whatever depends on "today" instead of keeping the old day.
 */
export const useStartOfToday = (): number => {
  const [startOfToday, setStartOfToday] = useState(() => startOfLocalDay(new Date()));

  useEffect(() => {
    // The buffer keeps a timer that fires a moment early from landing back on the same day and stalling.
    const timer = setTimeout(
      () => setStartOfToday(startOfLocalDay(new Date())),
      msUntilNextLocalDay(new Date()) + DAY_ROLLOVER_BUFFER_MS,
    );
    return () => clearTimeout(timer);
  }, [startOfToday]);

  return startOfToday;
};

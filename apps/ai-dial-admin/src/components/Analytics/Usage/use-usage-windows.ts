'use client';

import { useMemo, useRef, useState } from 'react';

import { ComparePeriod, ComparedWindows } from '@/src/components/Analytics/Usage/models';
import { buildComparedWindows } from '@/src/components/Analytics/Usage/utils/windows';
import { TimeRange } from '@/src/models/time-range';
import { ChartResolution, getChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

interface Params {
  timePeriod: string;
  timeRange: TimeRange;
  isCustom: boolean;
  getCurrentTimeRange: () => TimeRange;
  compare: ComparePeriod;
  refreshToken: number;
}

export interface UsageWindows {
  windows: ComparedWindows;
  resolution: ChartResolution;
}

/**
 * The windows every block reads, taken once per input change.
 *
 * A preset range is computed from the clock, so calling the getter during render would produce a
 * new window on every pass and re-issue every request forever. The window is a snapshot instead,
 * re-taken only when an input to it changes — seeding state and then re-taking it in an effect
 * gave every mount two windows, and so two of every request.
 */
export const useUsageWindows = ({
  timePeriod,
  timeRange,
  isCustom,
  getCurrentTimeRange,
  compare,
  refreshToken,
}: Params): UsageWindows => {
  const getRangeRef = useRef(getCurrentTimeRange);
  getRangeRef.current = getCurrentTimeRange;

  const [windowSnapshot, setWindowSnapshot] = useState(() => getCurrentTimeRange());
  // `isCustom` decides which range the getter reads, so switching to a custom range has to re-take
  // the snapshot even when the period id is unchanged.
  const snapshotKey = [
    timePeriod,
    isCustom,
    timeRange.startDate.getTime(),
    timeRange.endDate.getTime(),
    refreshToken,
  ].join('|');
  const takenKey = useRef(snapshotKey);

  if (takenKey.current !== snapshotKey) {
    takenKey.current = snapshotKey;
    setWindowSnapshot(getRangeRef.current());
  }

  const windows = useMemo(() => buildComparedWindows(windowSnapshot, compare), [windowSnapshot, compare]);
  const resolution = useMemo(() => getChartResolution(windows.current), [windows]);

  return { windows, resolution };
};

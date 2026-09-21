'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import { BucketPoint, RequestState, UsageView } from '@/src/components/Analytics/Usage/models';
import { buildBucketedQuery } from '@/src/components/Analytics/Usage/queries';
import { foldBucketPoints } from '@/src/components/Analytics/Usage/utils/folds';
import { getWeekRange } from '@/src/components/Analytics/Usage/utils/weeks';
import { TimeRange } from '@/src/models/time-range';
import { LoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';

const HOURLY: { value: number; unit: 'h' } = { value: 1, unit: 'h' };

interface Params {
  view: UsageView;
  refreshToken: number;
  notice: LoadFailureNotice;
}

export interface HeatmapWeek {
  week: TimeRange;
  weekOffset: number;
  buckets: RequestState<BucketPoint[]>;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

/**
 * The heatmap keeps its own week rather than following the page period: a grid of hour by day is
 * only readable over exactly seven days, and the page's period is free to be an hour or a month.
 */
export const useHeatmapWeek = ({ view, refreshToken, notice }: Params): HeatmapWeek => {
  const { report, reset } = notice;

  const [weekOffset, setWeekOffset] = useState(0);
  const [buckets, setBuckets] = useState<RequestState<BucketPoint[]>>({
    data: null,
    isLoading: true,
    hasFailed: false,
  });
  const generation = useRef(0);

  // The week is derived, not stored twice: seeding state and then re-taking it in an effect gave
  // every mount two windows and so two of every request.
  const [week, setWeek] = useState<TimeRange>(() => getWeekRange(0));
  const weekKey = `${weekOffset}|${refreshToken}`;
  const takenKey = useRef(weekKey);

  if (takenKey.current !== weekKey) {
    takenKey.current = weekKey;
    setWeek(getWeekRange(weekOffset));
  }

  useEffect(() => {
    generation.current += 1;
    const current = generation.current;

    reset();
    setBuckets({ data: null, isLoading: true, hasFailed: false });

    const read = async () => {
      try {
        const response = await executeQuery(buildBucketedQuery({ view, window: week }, HOURLY));

        if (response?.success) {
          return { data: foldBucketPoints(response.response ?? null), isLoading: false, hasFailed: false };
        }

        report(response?.errorMessage ?? response?.errorHeader);
      } catch (error) {
        report(error instanceof Error ? error.message : void 0);
      }

      return { data: null, isLoading: false, hasFailed: true };
    };

    void read().then((state) => {
      if (current !== generation.current) return;

      setBuckets(state);
    });
  }, [view, week, report, reset]);

  const onPreviousWeek = useCallback(() => setWeekOffset((offset) => offset + 1), []);
  const onNextWeek = useCallback(() => setWeekOffset((offset) => Math.max(0, offset - 1)), []);
  const onCurrentWeek = useCallback(() => setWeekOffset(0), []);

  return { week, weekOffset, buckets, onPreviousWeek, onNextWeek, onCurrentWeek };
};

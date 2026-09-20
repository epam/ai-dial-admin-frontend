import { ComparePeriod, ComparedWindows } from '@/src/components/Analytics/Usage/models';
import { TimeRange } from '@/src/models/time-range';

const getDurationMs = (range: TimeRange): number => range.endDate.getTime() - range.startDate.getTime();

/**
 * The same span ending where the current window begins, so a preset's sliding window and its
 * comparison always share an edge.
 */
export const getPreviousWindow = (current: TimeRange): TimeRange => {
  const startMs = current.startDate.getTime();
  return {
    startDate: new Date(startMs - getDurationMs(current)),
    endDate: new Date(startMs),
  };
};

export const buildComparedWindows = (current: TimeRange, compare: ComparePeriod): ComparedWindows =>
  compare === ComparePeriod.PreviousPeriod ? { current, previous: getPreviousWindow(current) } : { current };

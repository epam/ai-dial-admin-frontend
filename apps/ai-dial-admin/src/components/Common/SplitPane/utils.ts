import { DEFAULT_SPLIT_PERCENT, MIN_SPLIT_PERCENT } from '@/src/components/Common/SplitPane/constants';

/**
 * The legal size for the top section, as a percentage of the available height.
 *
 * Both sections carry the same floor, so the range is symmetric: the floor at one end and its complement at
 * the other. Passing `0` or `100` therefore answers the two ends, which is how a caller asks for either
 * extreme without repeating the arithmetic.
 *
 * A floor above the midpoint would leave no legal range at all, so it is capped there rather than inverting
 * the bounds and answering a value below its own floor.
 */
export const clampSplitPercent = (percent: number, minPercent: number = MIN_SPLIT_PERCENT): number => {
  const floor = Math.max(0, Math.min(minPercent, DEFAULT_SPLIT_PERCENT));

  // A measurement taken while the container was collapsed resolves to the middle rather than to an end: a
  // reader who never touched the separator has not asked for either extreme.
  if (!Number.isFinite(percent)) {
    return DEFAULT_SPLIT_PERCENT;
  }

  return Math.min(Math.max(percent, floor), 100 - floor);
};

export const stepSplitPercent = (percent: number, delta: number, minPercent: number = MIN_SPLIT_PERCENT): number =>
  clampSplitPercent(percent + delta, minPercent);

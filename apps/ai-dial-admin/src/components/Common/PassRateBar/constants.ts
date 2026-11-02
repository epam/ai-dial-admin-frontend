import { PassRateBand } from '@/src/components/Common/PassRateBar/models';

/** Lower bounds (0–1) of the green and yellow bands; anything below `PASS_RATE_MEDIUM_MIN` is red. */
export const PASS_RATE_HIGH_MIN = 0.7;
export const PASS_RATE_MEDIUM_MIN = 0.4;

/** Fill classes per band: the theme's saturated score strokes, with the built-in palette as fallback. */
export const PASS_RATE_BAND_CLASS: Record<PassRateBand, string> = {
  [PassRateBand.High]: 'bg-[var(--stroke-score-abs-10,#4dc87a)]',
  [PassRateBand.Medium]: 'bg-[var(--stroke-score-abs-05,#d4be3a)]',
  [PassRateBand.Low]: 'bg-[var(--stroke-score-abs-00,#ff4e50)]',
};

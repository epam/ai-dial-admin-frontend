import { PASS_RATE_HIGH_MIN, PASS_RATE_MEDIUM_MIN } from '@/src/components/Common/PassRateBar/constants';
import { PassRateBand } from '@/src/components/Common/PassRateBar/models';

/** Colour band of a 0–1 rate: green ≥ 70 %, yellow 40–69 %, red below 40 %. */
export const getPassRateBand = (rate: number): PassRateBand => {
  if (rate >= PASS_RATE_HIGH_MIN) {
    return PassRateBand.High;
  }
  if (rate >= PASS_RATE_MEDIUM_MIN) {
    return PassRateBand.Medium;
  }
  return PassRateBand.Low;
};

/** A 0–1 rate as a percentage with at most one decimal (`0.985` → `98.5%`, `0.5` → `50%`). */
export const formatPassRatePercent = (rate: number): string => `${Math.round(rate * 1000) / 10}%`;

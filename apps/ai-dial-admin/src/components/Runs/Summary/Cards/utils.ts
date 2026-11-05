import { SCORE_FRACTION_DIGITS } from './constants';

/** Overall score with a fixed three decimals (`0.58` → `0.580`). */
export const formatOverallScore = (score: number): string => score.toFixed(SCORE_FRACTION_DIGITS);

/** Threshold shown as stored, without padding (`0.6`). */
export const formatThreshold = (threshold: number): string => String(threshold);

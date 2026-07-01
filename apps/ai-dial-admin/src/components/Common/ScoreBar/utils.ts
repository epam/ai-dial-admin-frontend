import { SCORE_INDICATOR_COLORS, SCORE_INDICATOR_EMPTY_COLOR, SCORE_INDICATOR_STEP_EPSILON } from './constants';

export const clampScoreValue = (value: number): number => Math.min(1, Math.max(0, value));

export const getScoreIndicatorStep = (value: number): number => {
  const clamped = clampScoreValue(value);
  if (clamped >= 1) return 1;
  return Math.floor(clamped * 10 + SCORE_INDICATOR_STEP_EPSILON) / 10;
};

export const getScoreIndicatorColor = (value: number): string => {
  if (clampScoreValue(value) === 0) return SCORE_INDICATOR_EMPTY_COLOR;
  const step = getScoreIndicatorStep(value);
  return SCORE_INDICATOR_COLORS[step] ?? SCORE_INDICATOR_EMPTY_COLOR;
};

export const getScoreIndicatorFillRatio = (value: number): number => clampScoreValue(value);

export const isScoreIndicatorValue = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 1;

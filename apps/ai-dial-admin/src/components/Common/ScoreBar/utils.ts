import { SCORE_INDICATOR_COLORS } from './constants';

export const clampScoreValue = (value: number): number => Math.min(1, Math.max(0, value));

export const getScoreIndicatorStep = (value: number): number => {
  const clamped = clampScoreValue(value);
  if (clamped === 0) return 0;
  if (clamped === 1) return 1;
  return Math.ceil(clamped * 10) / 10;
};

export const getScoreIndicatorColor = (value: number): string => {
  const step = getScoreIndicatorStep(value);
  return SCORE_INDICATOR_COLORS[step] ?? SCORE_INDICATOR_COLORS[0];
};

export const getScoreIndicatorFillRatio = (value: number): number => clampScoreValue(value);

export const isScoreIndicatorValue = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 1;

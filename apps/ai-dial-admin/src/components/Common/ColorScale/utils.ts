import { ACCURACY_COLOR_MAP, ACCURACY_THRESHOLDS } from './constants';

export const getAccuracyColors = (value: number): { bg: string; border: string } => {
  const threshold = ACCURACY_THRESHOLDS.find((t) => value <= t) ?? ACCURACY_THRESHOLDS[ACCURACY_THRESHOLDS.length - 1];

  return ACCURACY_COLOR_MAP[threshold];
};

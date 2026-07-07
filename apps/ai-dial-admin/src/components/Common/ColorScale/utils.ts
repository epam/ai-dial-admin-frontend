import { ACCURACY_COLOR_MAP, ACCURACY_THRESHOLDS } from './constants';
import { AccuracyHeatCellStyle } from './models';

export const getAccuracyColors = (value: number): { bg: string; border: string } => {
  const threshold = ACCURACY_THRESHOLDS.find((t) => value <= t) ?? ACCURACY_THRESHOLDS[ACCURACY_THRESHOLDS.length - 1];

  return ACCURACY_COLOR_MAP[threshold];
};

export const getAccuracyHeatCellStyleFromColors = (colors: { bg: string; border: string }): AccuracyHeatCellStyle => ({
  backgroundColor: colors.bg,
  borderRight: `1px solid ${colors.border}`,
  borderBottom: `1px solid ${colors.border}`,
});

export const getAccuracyHeatCellStyleFromThreshold = (threshold: number): AccuracyHeatCellStyle =>
  getAccuracyHeatCellStyleFromColors(ACCURACY_COLOR_MAP[threshold]);

export const getAccuracyHeatCellStyle = (value: number): AccuracyHeatCellStyle =>
  getAccuracyHeatCellStyleFromColors(getAccuracyColors(value));

import {
  ACCURACY_COLOR_MAP,
  ACCURACY_THRESHOLDS,
  DELTA_NEGATIVE_COLOR_MAP,
  DELTA_NEGATIVE_THRESHOLDS,
  DELTA_NEUTRAL_SEGMENT,
  DELTA_POSITIVE_COLOR_MAP,
  DELTA_POSITIVE_THRESHOLDS,
} from './constants';
import { AccuracyHeatCellStyle } from './models';

export const getAccuracyColors = (value: number): { bg: string; border: string } => {
  const threshold = ACCURACY_THRESHOLDS.find((t) => value <= t) ?? ACCURACY_THRESHOLDS[ACCURACY_THRESHOLDS.length - 1];

  return ACCURACY_COLOR_MAP[threshold];
};

export const getDeltaColors = (value: number): { bg: string; border: string } | null => {
  if (value === 0) {
    return null;
  }

  if (value > 0) {
    const threshold =
      DELTA_POSITIVE_THRESHOLDS.find((t) => value <= t) ??
      DELTA_POSITIVE_THRESHOLDS[DELTA_POSITIVE_THRESHOLDS.length - 1];
    return DELTA_POSITIVE_COLOR_MAP[threshold];
  }

  const descendingThresholds = [...DELTA_NEGATIVE_THRESHOLDS].reverse();
  const threshold =
    descendingThresholds.find((t) => value >= t) ?? descendingThresholds[descendingThresholds.length - 1];
  return DELTA_NEGATIVE_COLOR_MAP[threshold];
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

export const getDeltaHeatCellStyle = (value: number): AccuracyHeatCellStyle | undefined => {
  const colors = getDeltaColors(value);
  return colors ? getAccuracyHeatCellStyleFromColors(colors) : undefined;
};

export const getDeltaNeutralHeatCellStyle = (): AccuracyHeatCellStyle =>
  getAccuracyHeatCellStyleFromColors(DELTA_NEUTRAL_SEGMENT);

import { DEFAULT_THEME } from '@/src/constants/theme';

import {
  ACCURACY_THRESHOLDS,
  DELTA_NEGATIVE_THRESHOLDS,
  DELTA_NEUTRAL_SEGMENT,
  DELTA_POSITIVE_THRESHOLDS,
  getAccuracyColorMap,
  getDeltaNegativeColorMap,
  getDeltaPositiveColorMap,
} from './constants';
import { AccuracyHeatCellStyle, HeatColorSegment } from './models';

export const getAccuracyColors = (value: number, theme: string = DEFAULT_THEME): HeatColorSegment => {
  const colorMap = getAccuracyColorMap(theme);
  const threshold = ACCURACY_THRESHOLDS.find((t) => value <= t) ?? ACCURACY_THRESHOLDS[ACCURACY_THRESHOLDS.length - 1];

  return colorMap[threshold];
};

export const getDeltaColors = (value: number, theme: string = DEFAULT_THEME): HeatColorSegment | null => {
  if (value === 0) {
    return null;
  }

  if (value > 0) {
    const colorMap = getDeltaPositiveColorMap(theme);
    const threshold =
      DELTA_POSITIVE_THRESHOLDS.find((t) => value <= t) ??
      DELTA_POSITIVE_THRESHOLDS[DELTA_POSITIVE_THRESHOLDS.length - 1];
    return colorMap[threshold];
  }

  const colorMap = getDeltaNegativeColorMap(theme);
  const descendingThresholds = [...DELTA_NEGATIVE_THRESHOLDS].reverse();
  const threshold =
    descendingThresholds.find((t) => value >= t) ?? descendingThresholds[descendingThresholds.length - 1];
  return colorMap[threshold];
};

export const getAccuracyHeatCellStyleFromColors = (colors: HeatColorSegment): AccuracyHeatCellStyle => ({
  backgroundColor: colors.bg,
  borderRight: `1px solid ${colors.border}`,
  borderBottom: `1px solid ${colors.border}`,
});

export const getAccuracyHeatCellStyleFromThreshold = (
  threshold: number,
  theme: string = DEFAULT_THEME,
): AccuracyHeatCellStyle => getAccuracyHeatCellStyleFromColors(getAccuracyColorMap(theme)[threshold]);

export const getAccuracyHeatCellStyle = (value: number, theme: string = DEFAULT_THEME): AccuracyHeatCellStyle =>
  getAccuracyHeatCellStyleFromColors(getAccuracyColors(value, theme));

export const getDeltaHeatCellStyle = (
  value: number,
  theme: string = DEFAULT_THEME,
): AccuracyHeatCellStyle | undefined => {
  const colors = getDeltaColors(value, theme);
  return colors ? getAccuracyHeatCellStyleFromColors(colors) : undefined;
};

export const getDeltaNeutralHeatCellStyle = (): AccuracyHeatCellStyle =>
  getAccuracyHeatCellStyleFromColors(DELTA_NEUTRAL_SEGMENT);

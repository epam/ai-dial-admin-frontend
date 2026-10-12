import { HEAT_MAP_VALUE_TIERS } from '@/src/components/Common/HeatMap/constants';
import { HeatMapValueTier } from '@/src/components/Common/HeatMap/models';

export const formatHeatMapCellValue = (value: number | null | undefined): string => {
  if (value == null) {
    return '—';
  }
  return value.toFixed(3);
};

export const formatHeatMapDeltaCellValue = (value: number): string => {
  if (value === 0) {
    return '0';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(3)}`;
};

export const formatHeatMapCellValueForMode = (value: number | null | undefined, isDeltaMode: boolean): string => {
  if (value == null) {
    return '—';
  }

  return isDeltaMode ? formatHeatMapDeltaCellValue(value) : formatHeatMapCellValue(value);
};

/** The largest tier whose text fits `columnWidth` without cropping, or `null` when even the smallest does not. */
export const resolveHeatMapValueTier = (columnWidth: number, isDeltaMode: boolean): HeatMapValueTier | null =>
  HEAT_MAP_VALUE_TIERS.find(
    ({ minWidthAbsolute, minWidthDelta }) => columnWidth >= (isDeltaMode ? minWidthDelta : minWidthAbsolute),
  ) ?? null;

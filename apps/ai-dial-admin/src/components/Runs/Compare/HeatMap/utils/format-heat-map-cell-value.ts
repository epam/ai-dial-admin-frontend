import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';

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

export const shouldShowHeatMapCellValue = (columnWidth: number): boolean =>
  columnWidth >= HEAT_MAP_VALUE_TEXT_MIN_WIDTH;

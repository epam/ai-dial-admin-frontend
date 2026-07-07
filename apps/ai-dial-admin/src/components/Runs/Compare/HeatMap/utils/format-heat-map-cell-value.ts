import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';

export const formatHeatMapCellValue = (value: number | null | undefined): string => {
  if (value == null) {
    return '—';
  }
  return value.toFixed(3);
};

export const shouldShowHeatMapCellValue = (columnWidth: number): boolean =>
  columnWidth >= HEAT_MAP_VALUE_TEXT_MIN_WIDTH;

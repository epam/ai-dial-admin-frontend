import { ITooltipParams } from 'ag-grid-community';

import { getAccuracyColors, getDeltaColors } from '@/src/components/Common/ColorScale/utils';
import { DELTA_NEUTRAL_SEGMENT } from '@/src/components/Common/ColorScale/constants';
import { RUN_COMPARE_PRIMARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { HEAT_MAP_GROUP_ROW_BG, HEAT_MAP_STROKE_TERTIARY } from '@/src/components/Runs/Compare/HeatMap/constants';
import {
  HeatMapCellTooltipData,
  HeatMapCellTooltipSwatch,
  HeatMapColorDisplayMode,
  HeatMapRow,
  HeatMapRowType,
} from '@/src/components/Runs/Compare/HeatMap/models';
import {
  formatHeatMapCellValue,
  formatHeatMapDeltaCellValue,
} from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';
import { RunsI18nKey } from '@/src/constants/i18n';

interface BuildHeatMapCellTooltipDataOptions {
  colorDisplayMode: HeatMapColorDisplayMode;
  testCaseLabel: string;
  primaryRunName: string;
  comparedRunName: string;
  colId: string;
  theme: string;
}

const formatCompareRunLabel = (runIndex: string, runName: string): string => `[${runIndex}] ${runName}`;

const getAbsoluteSwatchColors = (value: number, theme: string): { bg: string; border: string } => {
  if (value >= 0 && value <= 1) {
    return getAccuracyColors(value, theme);
  }

  return { bg: HEAT_MAP_GROUP_ROW_BG, border: HEAT_MAP_STROKE_TERTIARY };
};

const getDeltaSwatchColors = (value: number, theme: string): { bg: string; border: string } => {
  if (value === 0) {
    return DELTA_NEUTRAL_SEGMENT;
  }

  return getDeltaColors(value, theme) ?? DELTA_NEUTRAL_SEGMENT;
};

const buildValueSwatch = (value: number, isDeltaMode: boolean, theme: string): HeatMapCellTooltipSwatch => {
  const colors = isDeltaMode ? getDeltaSwatchColors(value, theme) : getAbsoluteSwatchColors(value, theme);
  const formattedValue = isDeltaMode ? formatHeatMapDeltaCellValue(value) : formatHeatMapCellValue(value);

  return {
    value: formattedValue,
    backgroundColor: colors.bg,
    borderColor: colors.border,
  };
};

export const buildHeatMapCellTooltipData = (
  params: ITooltipParams<HeatMapRow>,
  {
    colorDisplayMode,
    testCaseLabel,
    primaryRunName,
    comparedRunName,
    colId,
    theme,
  }: BuildHeatMapCellTooltipDataOptions,
): HeatMapCellTooltipData | undefined => {
  const row = params.data;
  if (!row || row.rowType === HeatMapRowType.Group) {
    return undefined;
  }

  const value = row.values[colId];
  const isDeltaMode = colorDisplayMode === HeatMapColorDisplayMode.Delta;
  const input = row.metricKey ?? row.label;
  const valueLabelKey = isDeltaMode
    ? RunsI18nKey.RunCompareHeatMapTooltipDelta
    : RunsI18nKey.RunCompareHeatMapTooltipScore;

  if (value === undefined || value === null) {
    const tooltipData: HeatMapCellTooltipData = {
      testCase: testCaseLabel,
      metric: row.groupKey,
      input,
      valueLabelKey,
      valueTextKey: RunsI18nKey.RunCompareHeatMapNotApplicable,
    };

    if (!isDeltaMode && row.runIndex != null) {
      const runName = row.runIndex === RUN_COMPARE_PRIMARY_INDEX ? primaryRunName : comparedRunName;
      tooltipData.runLabel = formatCompareRunLabel(row.runIndex, runName);
    }

    return tooltipData;
  }

  const tooltipData: HeatMapCellTooltipData = {
    testCase: testCaseLabel,
    metric: row.groupKey,
    input,
    valueRow: buildValueSwatch(value, isDeltaMode, theme),
    valueLabelKey,
  };

  if (!isDeltaMode && row.runIndex != null) {
    const runName = row.runIndex === RUN_COMPARE_PRIMARY_INDEX ? primaryRunName : comparedRunName;
    tooltipData.runLabel = formatCompareRunLabel(row.runIndex, runName);
  }

  return tooltipData;
};

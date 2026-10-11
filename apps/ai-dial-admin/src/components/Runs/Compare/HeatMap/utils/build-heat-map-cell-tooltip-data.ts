import { ITooltipParams } from 'ag-grid-community';

import classNames from 'classnames';

import { HeatMapCellTooltipSwatch } from '@/src/components/Common/HeatMap/models';
import {
  formatHeatMapCellValue,
  formatHeatMapDeltaCellValue,
} from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { RUN_COMPARE_PRIMARY_INDEX } from '@/src/components/Runs/Compare/constants';
import {
  HeatMapCellTooltipData,
  HeatMapColorDisplayMode,
  HeatMapRow,
  HeatMapRowType,
} from '@/src/components/Runs/Compare/HeatMap/models';
import { RunsI18nKey } from '@/src/constants/i18n';

interface BuildHeatMapCellTooltipDataOptions {
  colorDisplayMode: HeatMapColorDisplayMode;
  testCaseLabel: string;
  primaryRunName: string;
  comparedRunName: string;
  colId: string;
}

/** Neutral swatch for an out-of-range or zero-delta value — no score bucket applies. */
const NEUTRAL_SWATCH_CLASSNAME = 'bg-layer-3 border-tertiary';

const formatCompareRunLabel = (runIndex: string, runName: string): string => `[${runIndex}] ${runName}`;

const buildValueSwatch = (value: number, isDeltaMode: boolean): HeatMapCellTooltipSwatch => {
  const mode = isDeltaMode ? ScoreColorMode.Delta : ScoreColorMode.Absolute;
  const isInRange = mode === ScoreColorMode.Delta ? value >= -1 && value <= 1 : value >= 0 && value <= 1;
  const bucketKey = isInRange ? getScoreCellBucketKey(value, mode) : null;
  const classes = getScoreCellBucketClasses(bucketKey);
  const formattedValue = isDeltaMode ? formatHeatMapDeltaCellValue(value) : formatHeatMapCellValue(value);

  return {
    value: formattedValue,
    className: classes ? classNames(classes.background, classes.border) : NEUTRAL_SWATCH_CLASSNAME,
  };
};

export const buildHeatMapCellTooltipData = (
  params: ITooltipParams<HeatMapRow>,
  { colorDisplayMode, testCaseLabel, primaryRunName, comparedRunName, colId }: BuildHeatMapCellTooltipDataOptions,
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
    valueRow: buildValueSwatch(value, isDeltaMode),
    valueLabelKey,
  };

  if (!isDeltaMode && row.runIndex != null) {
    const runName = row.runIndex === RUN_COMPARE_PRIMARY_INDEX ? primaryRunName : comparedRunName;
    tooltipData.runLabel = formatCompareRunLabel(row.runIndex, runName);
  }

  return tooltipData;
};

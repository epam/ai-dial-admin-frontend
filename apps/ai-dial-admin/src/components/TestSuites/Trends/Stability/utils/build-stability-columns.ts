import { ColDef, ValueGetterParams } from 'ag-grid-community';

import HeatMapAxisHeader from '@/src/components/Common/HeatMap/HeatMapAxisHeader';
import HeatMapCellTooltip from '@/src/components/Common/HeatMap/HeatMapCellTooltip';
import HeatMapLabelCellRenderer from '@/src/components/Common/HeatMap/HeatMapLabelCellRenderer';
import {
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_LABEL_COL_WIDTH,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  getHeatMapDefaultCellStyle,
} from '@/src/components/Common/HeatMap/constants';
import { HeatMapCellTooltipContent, HeatMapGridRow } from '@/src/components/Common/HeatMap/models';
import { formatHeatMapCellValue } from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import ScoreCellRenderer from '@/src/components/Grid/CellRenderers/ScoreCellRenderer';
import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';
import { StabilityCellMeta } from '@/src/components/TestSuites/Trends/Stability/models';
import { NO_FILTER_COL_DEF } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { formatScore } from '@/src/components/TestSuites/Trends/utils/format';

const NEUTRAL_SWATCH_CLASSNAME = 'bg-layer-3 border-tertiary';

interface BuildStabilityColumnsOptions {
  testCaseColIds: string[];
  headerLabels: string[];
  cellMeta: Record<string, Record<string, StabilityCellMeta>>;
  thresholdByRowId: Record<string, number | null | undefined>;
  labels: {
    testCase: string;
    run: string;
    threshold: string;
    score: string;
    passed: string;
    notApplicable: string;
    passedYes: string;
    passedNo: string;
  };
}

const buildStabilityTooltip = (
  row: HeatMapGridRow | undefined,
  colId: string,
  testCaseLabel: string,
  cellMeta: Record<string, Record<string, StabilityCellMeta>>,
  thresholdByRowId: Record<string, number | null | undefined>,
  labels: BuildStabilityColumnsOptions['labels'],
): HeatMapCellTooltipContent | undefined => {
  if (!row) {
    return undefined;
  }

  const meta = cellMeta[row.id]?.[colId];
  const value = row.values[colId];
  const treshold = thresholdByRowId[row.id];

  const tooltipRows = [
    { label: labels.testCase, value: testCaseLabel },
    { label: labels.run, value: row.label },
    {
      label: labels.threshold,
      value: treshold == null ? labels.notApplicable : formatScore(treshold),
    },
  ];

  if (value === undefined || meta == null) {
    return {
      rows: tooltipRows,
      valueLabel: labels.score,
      valueText: labels.notApplicable,
    };
  }

  const scoreText = formatHeatMapCellValue(meta.score);
  const passedText =
    meta.passed === true ? labels.passedYes : meta.passed === false ? labels.passedNo : labels.notApplicable;

  tooltipRows.push({ label: labels.passed, value: passedText });

  const bucketKey =
    typeof meta.score === 'number' && meta.score >= 0 && meta.score <= 1
      ? getScoreCellBucketKey(meta.score, ScoreColorMode.Absolute)
      : null;
  const classes = getScoreCellBucketClasses(bucketKey);

  return {
    rows: tooltipRows,
    valueLabel: labels.score,
    valueRow: {
      value: scoreText,
      className: classes ? `${classes.background} ${classes.border}` : NEUTRAL_SWATCH_CLASSNAME,
    },
  };
};

export const buildStabilityColumns = ({
  testCaseColIds,
  headerLabels,
  cellMeta,
  thresholdByRowId,
  labels,
}: BuildStabilityColumnsOptions): ColDef<HeatMapGridRow>[] => {
  const labelColumn: ColDef<HeatMapGridRow> = {
    colId: HEAT_MAP_LABEL_COL_ID,
    field: 'label',
    headerName: ' ',
    pinned: 'left',
    width: HEAT_MAP_LABEL_COL_WIDTH,
    minWidth: HEAT_MAP_LABEL_COL_WIDTH,
    maxWidth: HEAT_MAP_LABEL_COL_WIDTH,
    ...NO_FILTER_COL_DEF,
    cellRenderer: HeatMapLabelCellRenderer,
    suppressMovable: true,
    cellStyle: () => getHeatMapDefaultCellStyle(),
    tooltipValueGetter: () => undefined,
  };

  const valueColumns: ColDef<HeatMapGridRow>[] = testCaseColIds.map((colId, index) => {
    const headerLabel = headerLabels[index] ?? colId;

    return {
      colId,
      headerName: headerLabel,
      headerComponent: HeatMapAxisHeader,
      headerComponentParams: { label: headerLabel },
      headerClass: 'heat-map-test-case-header',
      minWidth: HEAT_MAP_VALUE_COL_MIN_WIDTH,
      ...NO_FILTER_COL_DEF,
      cellRenderer: ScoreCellRenderer,
      cellRendererParams: { mode: ScoreColorMode.Absolute },
      valueGetter: (params: ValueGetterParams<HeatMapGridRow>) => {
        const value = params.data?.values?.[colId];
        return value === undefined ? null : value;
      },
      cellStyle: (params) => {
        const value = params.data?.values?.[colId];
        if (typeof value === 'number' && value >= 0 && value <= 1) {
          return undefined;
        }
        return getHeatMapDefaultCellStyle();
      },
      tooltipComponent: HeatMapCellTooltip,
      tooltipValueGetter: (params) =>
        buildStabilityTooltip(params.data, colId, headerLabel, cellMeta, thresholdByRowId, labels),
    };
  });

  return [labelColumn, ...valueColumns];
};

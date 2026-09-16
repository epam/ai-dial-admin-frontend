import { ColDef, ValueGetterParams } from 'ag-grid-community';

import { getAccuracyColors, getAccuracyHeatCellStyle } from '@/src/components/Common/ColorScale/utils';
import HeatMapAxisHeader from '@/src/components/Common/HeatMap/HeatMapAxisHeader';
import HeatMapCellTooltip from '@/src/components/Common/HeatMap/HeatMapCellTooltip';
import HeatMapLabelCellRenderer from '@/src/components/Common/HeatMap/HeatMapLabelCellRenderer';
import HeatMapValueCellRenderer from '@/src/components/Common/HeatMap/HeatMapValueCellRenderer';
import {
  HEAT_MAP_GROUP_ROW_BG,
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_LABEL_COL_WIDTH,
  HEAT_MAP_STROKE_TERTIARY,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  getHeatMapDefaultCellStyle,
} from '@/src/components/Common/HeatMap/constants';
import {
  HeatMapCellTooltipContent,
  HeatMapGridRow,
  HeatMapValueFormatMode,
} from '@/src/components/Common/HeatMap/models';
import { formatHeatMapCellValue } from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import { StabilityCellMeta } from '@/src/components/TestSuites/Trends/utils/pivot-stability';
import { NO_FILTER_COL_DEF } from '@/src/components/Runs/Compare/ExecutionResults/constants';

interface BuildStabilityColumnsOptions {
  testCaseColIds: string[];
  headerLabels: string[];
  cellMeta: Record<string, Record<string, StabilityCellMeta>>;
  theme: string;
  labels: {
    testCase: string;
    run: string;
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
  theme: string,
  labels: BuildStabilityColumnsOptions['labels'],
): HeatMapCellTooltipContent | undefined => {
  if (!row) {
    return undefined;
  }

  const meta = cellMeta[row.id]?.[colId];
  const value = row.values[colId];
  // Row = run, column = test case (Figma).
  const tooltipRows = [
    { label: labels.testCase, value: testCaseLabel },
    { label: labels.run, value: row.label },
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

  if (typeof meta.score === 'number' && meta.score >= 0 && meta.score <= 1) {
    const colors = getAccuracyColors(meta.score, theme);
    return {
      rows: tooltipRows,
      valueLabel: labels.score,
      valueRow: {
        value: scoreText,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      },
    };
  }

  return {
    rows: tooltipRows,
    valueLabel: labels.score,
    valueRow: {
      value: scoreText,
      backgroundColor: HEAT_MAP_GROUP_ROW_BG,
      borderColor: HEAT_MAP_STROKE_TERTIARY,
    },
  };
};

export const buildStabilityColumns = ({
  testCaseColIds,
  headerLabels,
  cellMeta,
  theme,
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
      cellRenderer: HeatMapValueCellRenderer,
      cellRendererParams: { formatMode: HeatMapValueFormatMode.Absolute },
      valueGetter: (params: ValueGetterParams<HeatMapGridRow>) => {
        const value = params.data?.values?.[colId];
        if (value === undefined) {
          return null;
        }
        return formatHeatMapCellValue(value);
      },
      cellStyle: (params) => {
        const value = params.data?.values?.[colId];
        if (typeof value === 'number' && value >= 0 && value <= 1) {
          return getAccuracyHeatCellStyle(value, theme);
        }
        return getHeatMapDefaultCellStyle();
      },
      tooltipComponent: HeatMapCellTooltip,
      tooltipValueGetter: (params) => buildStabilityTooltip(params.data, colId, headerLabel, cellMeta, theme, labels),
    };
  });

  return [labelColumn, ...valueColumns];
};

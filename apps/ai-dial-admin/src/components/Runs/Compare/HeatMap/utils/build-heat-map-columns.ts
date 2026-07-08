import { ColDef, ValueGetterParams } from 'ag-grid-community';

import {
  getAccuracyHeatCellStyle,
  getDeltaHeatCellStyle,
  getDeltaNeutralHeatCellStyle,
} from '@/src/components/Common/ColorScale/utils';
import ErrorCellRenderer from '@/src/components/Grid/CellRenderers/ErrorCellRenderer';
import HeatMapCellTooltip from '@/src/components/Runs/Compare/HeatMap/HeatMapCellTooltip';
import HeatMapLabelCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapLabelCellRenderer';
import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';
import HeatMapValueCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer';
import {
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_LABEL_COL_WIDTH,
  formatHeatMapTestCaseColId,
  formatHeatMapTestCaseHeader,
  getHeatMapDefaultCellStyle,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapColorDisplayMode, HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { formatHeatMapCellValueForMode } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';
import { buildHeatMapCellTooltipData } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-cell-tooltip-data';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { NO_FILTER_COL_DEF } from '@/src/components/Runs/Compare/ExecutionResults/constants';

interface BuildHeatMapColumnsOptions {
  colorDisplayMode: HeatMapColorDisplayMode;
  errorText?: string;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  primaryRunName: string;
  comparedRunName: string;
}

const getTestCaseKey = (row: CompareAnalyticsRow): string => row.testCaseId ?? row.testCaseName ?? row.id ?? '';

export const buildHeatMapColumns = (
  mergedRows: CompareAnalyticsRow[],
  {
    colorDisplayMode,
    errorText,
    expandedGroups,
    onToggleGroup,
    primaryRunName,
    comparedRunName,
  }: BuildHeatMapColumnsOptions,
): ColDef<HeatMapRow>[] => {
  const isDeltaMode = colorDisplayMode === HeatMapColorDisplayMode.Delta;
  const labelColumn: ColDef<HeatMapRow> = {
    colId: HEAT_MAP_LABEL_COL_ID,
    field: 'label',
    headerName: ' ',
    pinned: 'left',
    width: HEAT_MAP_LABEL_COL_WIDTH,
    minWidth: HEAT_MAP_LABEL_COL_WIDTH,
    maxWidth: HEAT_MAP_LABEL_COL_WIDTH,
    ...NO_FILTER_COL_DEF,
    cellRenderer: HeatMapLabelCellRenderer,
    cellRendererParams: {
      expandedGroups,
      onToggleGroup,
    },
    suppressMovable: true,
    cellStyle: () => getHeatMapDefaultCellStyle(),
    tooltipValueGetter: () => undefined,
  };

  const testCaseColumns: ColDef<HeatMapRow>[] = mergedRows.map((row, index) => {
    const testCaseKey = getTestCaseKey(row);
    const colId = formatHeatMapTestCaseColId(testCaseKey);

    const headerLabel = formatHeatMapTestCaseHeader(index);

    return {
      colId,
      headerName: headerLabel,
      headerComponent: HeatMapTestCaseHeader,
      headerComponentParams: { label: headerLabel },
      headerClass: 'heat-map-test-case-header',
      minWidth: 0,
      ...NO_FILTER_COL_DEF,
      cellRendererSelector: (params) => {
        if (params.data?.rowType === HeatMapRowType.Group) {
          return undefined;
        }
        const value = params.data?.values?.[colId];
        if (value === null) {
          return { component: ErrorCellRenderer, params: { errorText } };
        }
        return { component: HeatMapValueCellRenderer, params: { colorDisplayMode } };
      },
      valueGetter: (params: ValueGetterParams<HeatMapRow>) => {
        if (params.data?.rowType === HeatMapRowType.Group) {
          return '';
        }
        const value = params.data?.values?.[colId];
        if (value === undefined) {
          return null;
        }
        return formatHeatMapCellValueForMode(value, isDeltaMode);
      },
      cellStyle: (params) => {
        if (params.data?.rowType === HeatMapRowType.Group) {
          return getHeatMapDefaultCellStyle();
        }

        const value = params.data?.values?.[colId];
        if (isDeltaMode) {
          if (value === 0) {
            return getDeltaNeutralHeatCellStyle();
          }
          if (typeof value === 'number' && value !== 0) {
            return getDeltaHeatCellStyle(value) ?? getHeatMapDefaultCellStyle();
          }
          return getHeatMapDefaultCellStyle();
        }

        if (typeof value === 'number' && value >= 0 && value <= 1) {
          return getAccuracyHeatCellStyle(value);
        }

        return getHeatMapDefaultCellStyle();
      },
      tooltipComponent: HeatMapCellTooltip,
      tooltipValueGetter: (params) =>
        buildHeatMapCellTooltipData(params, {
          colorDisplayMode,
          testCaseLabel: headerLabel,
          primaryRunName,
          comparedRunName,
          colId,
        }),
    };
  });

  return [labelColumn, ...testCaseColumns];
};

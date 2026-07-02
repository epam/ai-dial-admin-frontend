import { ColDef, ValueGetterParams } from 'ag-grid-community';

import { getAccuracyHeatCellStyle } from '@/src/components/Common/ColorScale/utils';
import ErrorCellRenderer from '@/src/components/Grid/CellRenderers/ErrorCellRenderer';
import HeatMapLabelCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapLabelCellRenderer';
import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';
import HeatMapValueCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer';
import {
  HEAT_MAP_GROUP_ROW_BG,
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_LABEL_COL_WIDTH,
  formatHeatMapTestCaseColId,
  formatHeatMapTestCaseHeader,
  getHeatMapGridCellBorderStyle,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { formatHeatMapCellValue } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { NO_FILTER_COL_DEF } from '@/src/components/Runs/Compare/ExecutionResults/constants';

interface BuildHeatMapColumnsOptions {
  errorText?: string;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
}

const getTestCaseKey = (row: CompareAnalyticsRow): string => row.testCaseId ?? row.testCaseName ?? row.id ?? '';

export const buildHeatMapColumns = (
  mergedRows: CompareAnalyticsRow[],
  { errorText, expandedGroups, onToggleGroup }: BuildHeatMapColumnsOptions,
): ColDef<HeatMapRow>[] => {
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
        return { component: HeatMapValueCellRenderer };
      },
      valueGetter: (params: ValueGetterParams<HeatMapRow>) => {
        if (params.data?.rowType === HeatMapRowType.Group) {
          return '';
        }
        const value = params.data?.values?.[colId];
        if (value === undefined) {
          return null;
        }
        return formatHeatMapCellValue(value);
      },
      cellStyle: (params) => {
        if (params.data?.rowType === HeatMapRowType.Group) {
          return getHeatMapGridCellBorderStyle(HEAT_MAP_GROUP_ROW_BG);
        }
        const value = params.data?.values?.[colId];
        if (typeof value === 'number' && value >= 0 && value <= 1) {
          return getAccuracyHeatCellStyle(value);
        }
        if (value === undefined || value === null) {
          return getHeatMapGridCellBorderStyle();
        }
        return undefined;
      },
    };
  });

  return [labelColumn, ...testCaseColumns];
};

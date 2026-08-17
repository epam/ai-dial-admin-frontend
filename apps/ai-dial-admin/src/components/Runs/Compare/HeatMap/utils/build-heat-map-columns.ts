import { ColDef, ValueGetterParams } from 'ag-grid-community';

import {
  getAccuracyHeatCellStyle,
  getDeltaHeatCellStyle,
  getDeltaNeutralHeatCellStyle,
} from '@/src/components/Common/ColorScale/utils';
import HeatMapCellTooltip from '@/src/components/Runs/Compare/HeatMap/HeatMapCellTooltip';
import HeatMapLabelCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapLabelCellRenderer';
import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';
import HeatMapValueCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer';
import {
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_LABEL_COL_WIDTH,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  getHeatMapDefaultCellStyle,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapColorDisplayMode, HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { formatHeatMapCellValueForMode } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';
import { buildHeatMapCellTooltipData } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-cell-tooltip-data';
import {
  formatHeatMapTestCaseHeader,
  getHeatMapTestCaseColId,
  hasHeatMapMultiSubRuns,
  hasHeatMapMultiTurns,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-test-case-columns';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { NO_FILTER_COL_DEF } from '@/src/components/Runs/Compare/ExecutionResults/constants';

interface BuildHeatMapColumnsOptions {
  colorDisplayMode: HeatMapColorDisplayMode;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  primaryRunName: string;
  comparedRunName: string;
  theme: string;
}

export const buildHeatMapColumns = (
  mergedRows: CompareAnalyticsRow[],
  {
    colorDisplayMode,
    expandedGroups,
    onToggleGroup,
    primaryRunName,
    comparedRunName,
    theme,
  }: BuildHeatMapColumnsOptions,
): ColDef<HeatMapRow>[] => {
  const isDeltaMode = colorDisplayMode === HeatMapColorDisplayMode.Delta;
  const includeSubRunIndex = hasHeatMapMultiSubRuns(mergedRows);
  const includeTurnIndex = hasHeatMapMultiTurns(mergedRows);
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

  const testCaseColumns: ColDef<HeatMapRow>[] = mergedRows.map((row) => {
    const colId = getHeatMapTestCaseColId(row);
    const headerLabel = formatHeatMapTestCaseHeader(row, includeSubRunIndex, includeTurnIndex);

    return {
      colId,
      headerName: headerLabel,
      headerComponent: HeatMapTestCaseHeader,
      headerComponentParams: { label: headerLabel },
      headerClass: 'heat-map-test-case-header',
      minWidth: HEAT_MAP_VALUE_COL_MIN_WIDTH,
      ...NO_FILTER_COL_DEF,
      cellRendererSelector: (params) => {
        if (params.data?.rowType === HeatMapRowType.Group) {
          return undefined;
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
            return getDeltaHeatCellStyle(value, theme) ?? getHeatMapDefaultCellStyle();
          }
          return getHeatMapDefaultCellStyle();
        }

        if (typeof value === 'number' && value >= 0 && value <= 1) {
          return getAccuracyHeatCellStyle(value, theme);
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
          theme,
        }),
    };
  });

  return [labelColumn, ...testCaseColumns];
};

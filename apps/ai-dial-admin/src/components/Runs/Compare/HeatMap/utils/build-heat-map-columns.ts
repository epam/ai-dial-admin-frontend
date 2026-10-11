import { ColDef, ValueGetterParams } from 'ag-grid-community';

import {
  HEAT_MAP_LABEL_COL_ID,
  HEAT_MAP_LABEL_COL_WIDTH,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  HEAT_MAP_GRID_BORDER,
} from '@/src/components/Common/HeatMap/constants';
import HeatMapAxisHeader from '@/src/components/Common/HeatMap/HeatMapAxisHeader';
import ScoreCellRenderer from '@/src/components/Grid/CellRenderers/ScoreCellRenderer';
import HeatMapCellTooltip from '@/src/components/Runs/Compare/HeatMap/HeatMapCellTooltip';
import HeatMapLabelCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapLabelCellRenderer';
import { HeatMapColorDisplayMode, HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { buildHeatMapCellTooltipData } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-cell-tooltip-data';
import {
  formatHeatMapTestCaseHeader,
  getHeatMapTestCaseColId,
  hasHeatMapMultiRequests,
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
}

const isHeatMapGroupRow = (row: HeatMapRow | undefined): boolean =>
  row?.rowType === HeatMapRowType.Group || !!row?.isGroup;

export const buildHeatMapColumns = (
  mergedRows: CompareAnalyticsRow[],
  { colorDisplayMode, expandedGroups, onToggleGroup, primaryRunName, comparedRunName }: BuildHeatMapColumnsOptions,
): ColDef<HeatMapRow>[] => {
  const includeSubRunIndex = hasHeatMapMultiSubRuns(mergedRows);
  const includeRequestIndex = hasHeatMapMultiRequests(mergedRows);
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
    cellStyle: {
      borderRight: HEAT_MAP_GRID_BORDER,
      borderBottom: 'none',
      borderLeft: 'none',
      borderTop: 'none',
    },
    tooltipValueGetter: () => undefined,
  };

  const testCaseColumns: ColDef<HeatMapRow>[] = mergedRows.map((row) => {
    const colId = getHeatMapTestCaseColId(row);
    const headerLabel = formatHeatMapTestCaseHeader(row, { includeSubRunIndex, includeRequestIndex, includeTurnIndex });

    return {
      colId,
      headerName: headerLabel,
      headerComponent: HeatMapAxisHeader,
      headerComponentParams: { label: headerLabel },
      headerClass: 'heat-map-test-case-header',
      minWidth: HEAT_MAP_VALUE_COL_MIN_WIDTH,
      ...NO_FILTER_COL_DEF,
      cellRendererSelector: (params) => {
        if (isHeatMapGroupRow(params.data)) {
          return undefined;
        }
        return { component: ScoreCellRenderer, params: { mode: colorDisplayMode } };
      },
      valueGetter: (params: ValueGetterParams<HeatMapRow>) => {
        if (isHeatMapGroupRow(params.data)) {
          return '';
        }
        const value = params.data?.values?.[colId];
        return value === undefined ? null : value;
      },
      cellStyle: { border: 'none' },
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

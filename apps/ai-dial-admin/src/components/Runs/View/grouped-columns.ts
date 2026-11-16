import {
  CellRendererSelectorResult,
  ColDef,
  ColGroupDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';

import EmptyCellRenderer from '@/src/components/Grid/CellRenderers/EmptyCellRenderer';
import { GROUP_TOGGLE_COL_ID, OVERALL_SCORE_COL_ID, TEST_CASE_NAME_COL_ID } from '@/src/components/Runs/constants';
import { lockedWidthColDef, STATUS_COLUMN_WIDTH } from '@/src/components/Runs/grid-column-layout';
import { isTestCaseGroupRow } from '@/src/components/Runs/models';
import GroupToggleCellRenderer from '@/src/components/Runs/View/GroupToggleCellRenderer';
import { GroupedColumnsOptions } from '@/src/components/Runs/View/models';

/**
 * Both branches return an explicit component, so nothing relies on how the grid falls back to
 * `cellRenderer` when a selector returns `undefined`.
 */
const showRendererOnlyOn = (col: ColDef, isGroupRow: boolean): ColDef => {
  const { cellRenderer, cellRendererParams, ...rest } = col;
  return {
    ...rest,
    cellRendererSelector: (params): CellRendererSelectorResult =>
      isTestCaseGroupRow(params.data) === isGroupRow
        ? {
            component: cellRenderer,
            params: typeof cellRendererParams === 'function' ? cellRendererParams(params) : cellRendererParams,
          }
        : { component: EmptyCellRenderer },
  };
};

/** Columns that substitute a dash for a missing value (`—`, `getFormattedDuration`) must not do so for a group row. */
const blankOnGroupRows = (col: ColDef): ColDef => {
  const { valueGetter, valueFormatter } = col;
  return {
    ...col,
    ...(typeof valueGetter === 'function'
      ? { valueGetter: (params: ValueGetterParams) => (isTestCaseGroupRow(params.data) ? null : valueGetter(params)) }
      : {}),
    ...(typeof valueFormatter === 'function'
      ? {
          valueFormatter: (params: ValueFormatterParams) =>
            isTestCaseGroupRow(params.data) ? '' : valueFormatter(params),
        }
      : {}),
  };
};

const toGroupedLeaf = (col: ColDef): ColDef => {
  const colId = col.colId ?? col.field;
  const leaf: ColDef = { ...col, sortable: false, filter: false, floatingFilter: false };

  if (colId === TEST_CASE_NAME_COL_ID) {
    return { ...leaf, cellClassRules: { 'font-semibold': (params) => isTestCaseGroupRow(params.data) } };
  }
  if (colId === OVERALL_SCORE_COL_ID) return showRendererOnlyOn(leaf, true);
  if (leaf.cellRenderer) return showRendererOnlyOn(leaf, false);
  return blankOnGroupRows(leaf);
};

const mapLeaves = (cols: ColDef[], mapLeaf: (col: ColDef) => ColDef): ColDef[] =>
  cols.map((col) => {
    const children = (col as ColGroupDef).children as ColDef[] | undefined;
    return children ? ({ ...col, children: mapLeaves(children, mapLeaf) } as ColDef) : mapLeaf(col);
  });

/**
 * The expand/collapse column: pinned left, fixed in place and absent from the stored definitions, so the
 * columns panel never lists it and the user can neither hide nor move it.
 */
const buildToggleColumn = (options: GroupedColumnsOptions): ColDef => ({
  colId: GROUP_TOGGLE_COL_ID,
  headerName: ' ',
  ...lockedWidthColDef(STATUS_COLUMN_WIDTH),
  pinned: 'left',
  lockPinned: true,
  lockPosition: 'left',
  suppressMovable: true,
  resizable: false,
  sortable: false,
  filter: false,
  floatingFilter: false,
  cellRenderer: GroupToggleCellRenderer,
  cellRendererParams: options,
});

/**
 * The columns of the grouped grid, derived from the stored (flat) definitions rather than stored
 * themselves: the user's columns-panel choices live in the stored ones and must survive the switch.
 * `hide`, `colId` and widths are carried over untouched; the toggle column is added in front.
 */
export const getGroupedColumnDefs = (colDefs: ColDef[], options: GroupedColumnsOptions): ColDef[] => [
  buildToggleColumn(options),
  ...mapLeaves(colDefs, toGroupedLeaf),
];

import { ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import { getTurnExpanderColumn } from '@/src/components/TestSuites/utils/grouped-columns';
import { GridRowType, GroupedGridRow, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { getAnalyticsColumns } from './utils';

const NAME_COL_ID = 'testCaseName';
const STATUS_COL_ID = 'status';

const isGroupRow = (data?: GroupedGridRow): boolean => data?.rowType === GridRowType.GROUP;
const firstTurn = (data?: GroupedGridRow): TestCaseRow | undefined => data?.turns?.[0];

/** Compute a column's display value for one turn, reusing the column's own value logic. */
const valueForTurn = (col: ColDef, valueGetter: ColDef['valueGetter'], turn: TestCaseRow): unknown => {
  if (typeof valueGetter === 'function') {
    return valueGetter({ data: turn, colDef: col } as unknown as ValueGetterParams);
  }
  const field = col.field;
  if (!field) return undefined;
  return (turn.data as Record<string, unknown> | undefined)?.[field] ?? turn[field];
};

/** Name column: name + `N turns` badge for GROUP, `Turn k` + name for TURN, default text for SINGLE. */
const withNameSelector = (col: ColDef): ColDef => ({
  ...col,
  sortable: false,
  sort: null,
  sortIndex: null,
  cellRendererSelector: (params) => {
    const rowType = (params.data as GroupedGridRow | undefined)?.rowType;
    if (rowType === GridRowType.GROUP || rowType === GridRowType.TURN) {
      return { component: TestCaseNameCellRenderer };
    }
    return undefined;
  },
});

/** Data column: stack every turn's value on the GROUP summary row; keep per-turn rendering otherwise. */
const withStackedGroup = (col: ColDef): ColDef => {
  const originalGetter = col.valueGetter;
  const originalRenderer = col.cellRenderer;
  return {
    ...col,
    // Sorting is disabled in grouped mode: ag-grid community can't keep turns under a synthesized
    // parent while sorting, so a column sort would either scatter turns or no-op confusingly.
    sortable: false,
    sort: null,
    sortIndex: null,
    valueGetter: (params: ValueGetterParams) => {
      if (isGroupRow(params.data as GroupedGridRow)) {
        const turn = firstTurn(params.data as GroupedGridRow);
        return turn ? valueForTurn(col, originalGetter, turn) : null;
      }
      if (typeof originalGetter === 'function') return originalGetter(params);
      return col.field ? params.data?.[col.field] : undefined;
    },
    cellRendererSelector: (params: ICellRendererParams) => {
      if (isGroupRow(params.data as GroupedGridRow)) {
        return {
          component: StackedTurnsCellRenderer,
          params: { getTurnValue: (turn: TestCaseRow) => valueForTurn(col, originalGetter, turn) },
        };
      }
      return originalRenderer ? { component: originalRenderer } : undefined;
    },
  };
};

const transformColumn = (col: ColDef): ColDef => {
  if (Array.isArray((col as ColDef & { children?: ColDef[] }).children)) {
    const parent = col as ColDef & { children: ColDef[] };
    return { ...parent, children: parent.children.map(transformColumn) } as ColDef;
  }
  if (col.colId === NAME_COL_ID) return withNameSelector(col);
  if (col.colId === STATUS_COL_ID) return { ...col, sortable: false, sort: null, sortIndex: null };
  return withStackedGroup(col);
};

/**
 * Transform an existing analytics column set for the grouped (multi-turn) grid: prepend the expander
 * column, make the name column rowType-aware, and give every data column a GROUP-row stacked renderer.
 * Column sorting is disabled while grouped (ag-grid community can't keep turns under a synthesized
 * parent during a sort). Falls back to the plain columns' behavior for single-turn (and legacy
 * no-`multiTurnId`) rows. Accepts the live (tree-panel-reordered) columns so panel changes persist.
 */
export const applyResultsGrouping = (colDefs: ColDef[], onToggleExpand: (groupKey: string) => void): ColDef[] => [
  getTurnExpanderColumn(onToggleExpand),
  ...colDefs.map(transformColumn),
];

/** Convenience: build grouped columns straight from results (used in tests/initial build). */
export const getGroupedAnalyticsColumns = (
  results: AnalyticsResult[],
  onToggleExpand: (groupKey: string) => void,
): ColDef[] => applyResultsGrouping(getAnalyticsColumns(results), onToggleExpand);

import { ColDef, GridOptions } from 'ag-grid-community';

import ActionCellRenderer from '@/src/components/Grid/ActionColumn/ActionCellRenderer';
import ActionColumn from '@/src/components/Grid/ActionColumn/ActionColumn';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { DiffStatus } from '@/src/types/activity-audit';

export const PAGE_SIZE = 100;
export const CACHE_LIMIT = 1000;
export const FLOATING_FILTER_DEBOUNCE_MS = 400;

export const infiniteGridOptions: Partial<GridOptions> = {
  rowModelType: 'infinite',
  cacheBlockSize: PAGE_SIZE,
  blockLoadDebounceMillis: 200,
  maxBlocksInCache: Math.floor(CACHE_LIMIT / PAGE_SIZE),
};

export const NO_BORDER_CLASS = 'ag-grid-no-border';
export const NO_CHECKBOX_CLASS = 'ag-grid-no-checkbox';

export const ACTIONS_COLUMN_CEL_ID = 'actionsColumn';
export const CHECKBOX_COLUMN_CEL_ID = 'checkboxColumn';
export const DRAGGABLE_COLUMN_CEL_ID = 'draggableColumn';
export const RADIO_COLUMN_CEL_ID = 'radioColumn';

const UTILITY_COLUMN_WIDTH = 32;

export const UTILITY_COLUMN: ColDef = {
  width: UTILITY_COLUMN_WIDTH,
  minWidth: UTILITY_COLUMN_WIDTH,
  maxWidth: UTILITY_COLUMN_WIDTH,
  headerName: ' ',
  floatingFilter: false,
  filter: false,
  sortable: false,
  suppressNavigable: true,
  suppressColumnsToolPanel: true,
  suppressHeaderMenuButton: true,
};

export const ACTION_COLUMN = <T>(
  items: ActionMenuOperationDeclaration<T>[],
  disabledInsteadHidden?: boolean,
): ColDef => ({
  ...UTILITY_COLUMN,
  field: ACTIONS_COLUMN_CEL_ID,
  cellRenderer: ActionColumn,
  cellRendererParams: { items, disabledInsteadHidden },
  cellClass: 'relative',
  pinned: 'right',
  lockPinned: true,
});

export const ONE_ACTION_COLUMN = <T>(item: ActionMenuOperationDeclaration<T>): ColDef => ({
  ...UTILITY_COLUMN,
  width: UTILITY_COLUMN_WIDTH,
  minWidth: UTILITY_COLUMN_WIDTH,
  maxWidth: UTILITY_COLUMN_WIDTH,
  field: ACTIONS_COLUMN_CEL_ID,
  cellRenderer: ActionCellRenderer,
  cellRendererParams: { item },
  cellClass: NO_BORDER_CLASS,
  pinned: 'right',
  lockPinned: true,
});

const RADIO_BUTTON_COLUMN_WIDTH = 40;
export const RADIO_BUTTON_COL_DEF: ColDef = {
  ...UTILITY_COLUMN,
  colId: RADIO_COLUMN_CEL_ID,
  cellClass: [NO_BORDER_CLASS, NO_CHECKBOX_CLASS],
  width: RADIO_BUTTON_COLUMN_WIDTH,
  minWidth: RADIO_BUTTON_COLUMN_WIDTH,
  maxWidth: RADIO_BUTTON_COLUMN_WIDTH,
  pinned: 'left',
};

export const CHECKBOX_COL_DEF: ColDef = {
  ...UTILITY_COLUMN,
  width: 35,
  minWidth: 35,
  maxWidth: 35,
  colId: CHECKBOX_COLUMN_CEL_ID,
  cellClass: NO_BORDER_CLASS,
  pinned: 'left',
  checkboxSelection: true,
};

export const DRAGGABLE_COL_DEF: ColDef = {
  ...UTILITY_COLUMN,
  colId: DRAGGABLE_COLUMN_CEL_ID,
  cellClass: NO_BORDER_CLASS,
  rowDrag: true,
};

export const MULTI_ROW_SELECTION: Partial<GridOptions> = {
  rowSelection: {
    mode: 'multiRow',
    headerCheckbox: true,
    selectAll: 'filtered',
  },
  selectionColumnDef: {
    ...CHECKBOX_COL_DEF,
  },
};

export const SINGLE_ROW_SELECTION: Partial<GridOptions> = {
  rowSelection: {
    mode: 'singleRow',
    enableClickSelection: true,
  },
  selectionColumnDef: {
    ...RADIO_BUTTON_COL_DEF,
  },
};

export const DIFF_ROW_CLASS_RULES: GridOptions['rowClassRules'] = {
  'ag-error-row ag-error-border': (params) => (params.data as ActivityAuditDiff).diffStatus === DiffStatus.REMOVED,
  'ag-new-row ag-new-border': (params) => (params.data as ActivityAuditDiff).diffStatus === DiffStatus.ADDED,
  'ag-changed-row ag-changed-border': (params) => (params.data as ActivityAuditDiff).diffStatus === DiffStatus.CHANGED,
  'ag-empty-row': (params) => (params.data as ActivityAuditDiff).diffStatus === DiffStatus.MIRROR,
};

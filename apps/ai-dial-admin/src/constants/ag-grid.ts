import { ColDef } from 'ag-grid-community';

import ActionColumn from '@/src/components/Grid/ActionColumn/ActionColumn';
import { EntityOperationDeclaration } from '@/src/models/entity-operations';

export const PAGE_SIZE = 100;
export const CACHE_LIMIT = 1000;

export const NO_BORDER_CLASS = 'ag-grid-no-border';
export const NO_CHECKBOX_CLASS = 'ag-grid-no-checkbox';

export const ACTIONS_COLUMN_CELL_RENDERER_KEY = 'actionsColumn';
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

export const ACTION_COLUMN = <T>(items: EntityOperationDeclaration<T>[]): ColDef => ({
  ...UTILITY_COLUMN,
  field: ACTIONS_COLUMN_CEL_ID,
  cellRenderer: ActionColumn,
  cellRendererParams: { items },
  cellClass: 'relative',
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

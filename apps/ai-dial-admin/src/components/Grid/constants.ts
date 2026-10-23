import { GRID_SELECTION_COLUMN_ID } from '@epam/ai-dial-ui-kit';
import { FileManagerColumnKey } from '@epam/ai-dial-react-file-manager';
import type { ColumnResizedEvent } from 'ag-grid-community';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';

export const ROW_HEIGHT = 48;
/** Default row height of lists whose name cell carries an icon. */
export const ICON_ROW_HEIGHT = 56;
/** Row height of the Assets lists, which stay denser than the other lists. */
export const ASSETS_ROW_HEIGHT = 40;
/** The grid's own header row. A caller sizing a bounded grid has to account for it. */
export const HEADER_HEIGHT = 40;
export const TWO_LINE_ROW_HEIGHT = 64;
export const GRID_COLUMNS_KEY = 'gridColumnsState';
export const STACKED_LINE_HEIGHT = 22;
export const STACKED_ROW_PADDING = 10;
/** Resize sources dispatched by the grid itself; the operator did not choose these widths. */
export const GRID_SIZED_RESIZE_SOURCES: ColumnResizedEvent['source'][] = ['autosizeColumns', 'sizeColumnsToFit'];
export const GRID_STATE_SAVE_DEBOUNCE_MS = 300;
/** Columns kept first in a grid that restores a stored order: the kit grid's row-selection column. */
export const LEADING_COLUMN_IDS = [GRID_SELECTION_COLUMN_ID];
/** Columns kept last in a grid that restores a stored order: the row actions (⋮) column. */
export const TRAILING_COLUMN_IDS = [FileManagerColumnKey.Actions, ACTIONS_COLUMN_CEL_ID];

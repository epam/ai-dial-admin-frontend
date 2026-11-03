import { ROW_DETAIL_FIELD_COL_MIN, ROW_DETAIL_HEADER_HEIGHT } from '@/src/components/Runs/Details/RowDetails/constants';

export const EXECUTION_ROW_DETAIL_CLAMP_CLASS = 'line-clamp-3';

export const EXECUTION_ROW_DETAIL_GRID_TEMPLATE_COLUMNS = `${ROW_DETAIL_FIELD_COL_MIN}px minmax(0, 1fr)`;

/** The sticky chrome is the column header plus a filter row of the same height. */
export const EXECUTION_ROW_DETAIL_SCROLL_PADDING_TOP = ROW_DETAIL_HEADER_HEIGHT * 2;

/** Matches the Figma 48px minimum row; a clamped three-line value makes the row taller, not scrollable. */
export const EXECUTION_ROW_DETAIL_CELL_BASE =
  'relative min-w-0 min-h-12 p-3 flex items-center overflow-hidden border-b border-secondary bg-layer-3';

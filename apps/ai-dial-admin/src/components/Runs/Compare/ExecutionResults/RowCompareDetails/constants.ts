import {
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
} from '@/src/components/Runs/Details/RowDetails/constants';

export const DEFAULT_HIDDEN_ROW_DETAIL_FIELDS = new Set<string>([
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
]);

export const ROW_DETAIL_FIELD_COL_MIN = 212;
export const ROW_DETAIL_DELTA_COL_WIDTH = 78;
export const ROW_DETAIL_ACTION_COL_WIDTH = 40;
export const ROW_DETAIL_MINIMAP_COL_WIDTH = 16;
export const ROW_DETAIL_HEADER_HEIGHT = 40;
export const ROW_DETAIL_FILTER_ROW_HEIGHT = 28;

export const ROW_DETAIL_GRID_TEMPLATE_COLUMNS = `${ROW_DETAIL_FIELD_COL_MIN}px minmax(0, 1fr) minmax(0, 1fr) ${ROW_DETAIL_DELTA_COL_WIDTH}px ${ROW_DETAIL_ACTION_COL_WIDTH}px`;

export const ROW_DETAIL_CELL_BASE = 'p-3 border-b border-tertiary bg-layer-3 max-h-[104px] overflow-hidden';
export const ROW_DETAIL_HEADER_CELL_BASE =
  'sticky top-0 z-10 bg-layer-1 h-10 px-3 border-b border-r border-secondary flex items-center';
export const ROW_DETAIL_FILTER_CELL_BASE =
  'sticky z-10 bg-layer-2 h-7 border-b border-r border-secondary flex items-center';
export const ROW_DETAIL_FIELD_INDENT = 'pl-16';

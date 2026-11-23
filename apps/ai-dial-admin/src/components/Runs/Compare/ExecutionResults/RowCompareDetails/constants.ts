import {
  ROW_DETAIL_FIELD_COL_MIN,
  ROW_DETAIL_HEADER_HEIGHT,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
} from '@/src/components/Runs/Details/RowDetails/constants';

export const DEFAULT_HIDDEN_ROW_DETAIL_FIELDS = new Set<string>([
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
]);

export const ROW_DETAIL_DELTA_COL_WIDTH = 78;
export const ROW_DETAIL_ACTION_COL_WIDTH = 40;
export const ROW_DETAIL_MINIMAP_COL_WIDTH = 16;
export const ROW_DETAIL_FILTER_ROW_HEIGHT = 28;
export const ROW_DETAIL_TABLE_SCROLL_PADDING_TOP = ROW_DETAIL_HEADER_HEIGHT + ROW_DETAIL_FILTER_ROW_HEIGHT;

/**
 * Each run's value column keeps room for a score and its threshold icon, taking the space from the field column
 * (which only shrinks below its usual width when the side panel is narrow) rather than clipping the icon.
 */
export const ROW_DETAIL_VALUE_COL_MIN = 72;
export const ROW_DETAIL_FIELD_COL_NARROW_MIN = 140;

export const ROW_DETAIL_GRID_TEMPLATE_COLUMNS = `minmax(${ROW_DETAIL_FIELD_COL_NARROW_MIN}px, ${ROW_DETAIL_FIELD_COL_MIN}px) minmax(${ROW_DETAIL_VALUE_COL_MIN}px, 1fr) minmax(${ROW_DETAIL_VALUE_COL_MIN}px, 1fr) ${ROW_DETAIL_DELTA_COL_WIDTH}px ${ROW_DETAIL_ACTION_COL_WIDTH}px`;

export const ROW_DETAIL_CELL_BASE = 'p-3 border-b border-tertiary bg-layer-3 max-h-[104px] overflow-hidden';

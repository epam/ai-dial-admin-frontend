import { HeatMapValueTier } from '@/src/components/Common/HeatMap/models';

/** Default AG Grid colId prefix for heatmap value columns (Compare test-case cols). */
export const HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE = 'tc_';

/** Trends Stability run columns. */
export const HEAT_MAP_VALUE_COL_PREFIX_RUN = 'run_';

/** Below this value-column width the header turns vertical and rows drop to `HEAT_MAP_ROW_HEIGHT`. */
export const HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH = 48;
export const HEAT_MAP_VALUE_COL_MIN_WIDTH = 14;
export const HEAT_MAP_LABEL_COL_WIDTH = 191;
export const HEAT_MAP_ROW_HEIGHT = 20;
export const HEAT_MAP_GROUP_ROW_HEIGHT = 40;
export const HEAT_MAP_HEADER_HEIGHT_HORIZONTAL = 28;
export const HEAT_MAP_HEADER_LABEL_LINE_HEIGHT = 20;
export const HEAT_MAP_HEADER_VERTICAL_FONT_SIZE = 10;
export const HEAT_MAP_HEADER_VERTICAL_LINE_HEIGHT = 12;
export const HEAT_MAP_HEADER_LABEL_TOP_PADDING = 4;
export const HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING = 4;
export const HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING =
  HEAT_MAP_HEADER_LABEL_TOP_PADDING + HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING;
export const HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH = 6;
export const HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER = 2;
export const HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT = 28;
export const HEAT_MAP_HEADER_VERTICAL_MAX_HEIGHT = 140;
/**
 * Largest first. `minWidth*` = widest score string in Inter semibold at that size (`0.000` / `+0.000`)
 * + both paddings + 2px (the cell's right border and rounding). Re-measure if the theme font changes.
 */
export const HEAT_MAP_VALUE_TIERS: HeatMapValueTier[] = [
  { textClassName: 'dial-small-text', paddingClassName: 'px-3', minWidthAbsolute: 67, minWidthDelta: 77 },
  { textClassName: 'dial-tiny-text', paddingClassName: 'px-2', minWidthAbsolute: 53, minWidthDelta: 61 },
  { textClassName: 'dial-caption-text', paddingClassName: 'px-1', minWidthAbsolute: 40, minWidthDelta: 46 },
];
export const HEAT_MAP_LABEL_COL_ID = 'heatMapLabel';
export const HEAT_MAP_STROKE_TERTIARY = 'var(--stroke-tertiary, #E0E6F0)';
export const HEAT_MAP_GRID_BORDER = `1px solid ${HEAT_MAP_STROKE_TERTIARY}`;
export const HEAT_MAP_GROUP_ROW_BG = 'var(--bg-layer-sunken, #EEF1F7)';

export const getHeatMapGridCellBorderStyle = (backgroundColor?: string) => ({
  ...(backgroundColor ? { backgroundColor } : {}),
  borderRight: HEAT_MAP_GRID_BORDER,
  borderBottom: HEAT_MAP_GRID_BORDER,
});

export const getHeatMapDefaultCellStyle = () => getHeatMapGridCellBorderStyle(HEAT_MAP_GROUP_ROW_BG);

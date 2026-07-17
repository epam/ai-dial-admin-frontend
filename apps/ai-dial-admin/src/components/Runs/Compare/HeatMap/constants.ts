export const HEAT_MAP_METRICS_SEARCH_THRESHOLD = 8;
export const HEAT_MAP_METRICS_DROPDOWN_MAX_HEIGHT = 162;

export const HEAT_MAP_VALUE_TEXT_MIN_WIDTH = 48;
export const HEAT_MAP_LABEL_COL_WIDTH = 191;
export const HEAT_MAP_ROW_HEIGHT = 20;
export const HEAT_MAP_GROUP_ROW_HEIGHT = 40;
export const HEAT_MAP_HEADER_HEIGHT_HORIZONTAL = 28;
export const HEAT_MAP_HEADER_LABEL_LINE_HEIGHT = 20;
export const HEAT_MAP_HEADER_LABEL_TOP_PADDING = 4;
export const HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING = 4;
export const HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING =
  HEAT_MAP_HEADER_LABEL_TOP_PADDING + HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING;
export const HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH = 9;
export const HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER = 2;
export const HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT = 28;
export const HEAT_MAP_HEADER_VERTICAL_MAX_HEIGHT = 140;
export const HEAT_MAP_LABEL_COL_ID = 'heatMapLabel';
export const HEAT_MAP_STROKE_TERTIARY = 'var(--stroke-tertiary, #0C101D)';
export const HEAT_MAP_GRID_BORDER = `1px solid ${HEAT_MAP_STROKE_TERTIARY}`;
export const HEAT_MAP_GROUP_ROW_BG = 'var(--bg-layer-3, #1D2439)';

export const getHeatMapGridCellBorderStyle = (backgroundColor?: string) => ({
  ...(backgroundColor ? { backgroundColor } : {}),
  borderRight: HEAT_MAP_GRID_BORDER,
  borderBottom: HEAT_MAP_GRID_BORDER,
});

export const getHeatMapDefaultCellStyle = () => getHeatMapGridCellBorderStyle(HEAT_MAP_GROUP_ROW_BG);

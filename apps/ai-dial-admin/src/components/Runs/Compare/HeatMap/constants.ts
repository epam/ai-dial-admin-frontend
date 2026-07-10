export const HEAT_MAP_VALUE_TEXT_MIN_WIDTH = 48;
export const HEAT_MAP_LABEL_COL_WIDTH = 191;
export const HEAT_MAP_ROW_HEIGHT = 20;
export const HEAT_MAP_GROUP_ROW_HEIGHT = 40;
export const HEAT_MAP_HEADER_HEIGHT = 90;
export const HEAT_MAP_HEADER_HEIGHT_HORIZONTAL = 28;
export const HEAT_MAP_HEADER_LABEL_BOTTOM_PADDING = 4;
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

export const formatHeatMapTestCaseHeader = (index: number): string => `Row ${String(index + 1).padStart(3, '0')}`;

export const formatHeatMapTestCaseColId = (testCaseKey: string): string => `tc_${testCaseKey}`;

export const ROW_HEIGHT = 48;
export const GRID_COLUMNS_KEY = 'gridColumnsState';

/**
 * Per-turn line height (px) and vertical padding (px) for a collapsed GROUP summary row's stacked
 * turns. Shared by the row-height calculation (`useTurnGroupProjection`) and the stacked renderer
 * (`StackedTurnsCellRenderer`) so a row is always sized to exactly hold its lines — see comment there.
 */
export const STACKED_LINE_HEIGHT = 22;
export const STACKED_ROW_PADDING = 10;

import { ColDef } from 'ag-grid-community';

export const STATUS_COLUMN_WIDTH = 40;
export const RUN_INDEX_COLUMN_WIDTH = 140;
export const TEST_CASE_NAME_COLUMN_WIDTH = 156;
export const HTTP_COLUMN_WIDTH = 80;
export const DURATION_COLUMN_WIDTH = 100;
export const EXTRACTED_COLUMN_MIN_WIDTH = 120;
export const METRIC_COLUMN_WIDTH = 148;
export const DELTA_COLUMN_WIDTH = 80;
export const DEFAULT_COMPARE_DELTA_HEADER = 'Delta';
export const COMPARE_ACTION_COL_ID = 'compare_action';
export const COMPARE_ACTION_COLUMN_WIDTH = 40;

export const COMPARE_GROUP_HEADER_HEIGHT = 28;

export const EXECUTION_GROUP_HEADER = 'Execution';
export const EXECUTION_STATUS_GROUP_HEADER = 'Execution status';
export const EXTRACTED_GROUP_HEADER = 'Extracted';

export const TEXT_FILTER_COL_DEF: Pick<ColDef, 'filter' | 'floatingFilter' | 'floatingFilterComponent'> = {
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  floatingFilterComponent: 'agTextColumnFloatingFilter',
};

export const NUMBER_FILTER_COL_DEF: Pick<ColDef, 'filter' | 'floatingFilter' | 'floatingFilterComponent'> = {
  filter: 'agNumberColumnFilter',
  floatingFilter: true,
  floatingFilterComponent: 'agNumberColumnFloatingFilter',
};

export const NO_FILTER_COL_DEF: Pick<ColDef, 'filter' | 'floatingFilter'> = {
  filter: false,
  floatingFilter: false,
};

export const formatCompareColumnHeader = (runIndex: string, label: string) => `[${runIndex}] ${label}`;

export const compareGridOptions = {
  groupHeaderHeight: COMPARE_GROUP_HEADER_HEIGHT,
  hidePaddedHeaderRows: true,
};

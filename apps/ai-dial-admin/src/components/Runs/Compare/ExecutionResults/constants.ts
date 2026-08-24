import { CellClassParams } from 'ag-grid-community';

export {
  DURATION_COLUMN_WIDTH,
  EXTRACTED_COLUMN_MIN_WIDTH,
  fixedWidthColDef,
  HTTP_COLUMN_WIDTH,
  METRIC_COLUMN_WIDTH,
  NO_FILTER_COL_DEF,
  NUMBER_FILTER_COL_DEF,
  REQUEST_INDEX_COLUMN_WIDTH,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
  TEXT_FILTER_COL_DEF,
  TURN_INDEX_COLUMN_WIDTH,
} from '@/src/components/Runs/grid-column-layout';

export const DELTA_COLUMN_WIDTH = 80;
export const DEFAULT_COMPARE_DELTA_HEADER = 'Delta';

export const COMPARE_GROUP_HEADER_HEIGHT = 28;

export const EXECUTION_GROUP_HEADER = 'Execution';
export const EXECUTION_STATUS_GROUP_HEADER = 'Execution status';
export const EXTRACTED_GROUP_HEADER = 'Extracted';

export const formatCompareColumnHeader = (runIndex: string, label: string) => `[${runIndex}] ${label}`;

export const COMPARE_MISSING_DISPLAY = '—';

export const compareMissingValueCellClassRules = {
  'text-secondary': (params: CellClassParams) => params.value === COMPARE_MISSING_DISPLAY,
};

export const compareGridOptions = {
  groupHeaderHeight: COMPARE_GROUP_HEADER_HEIGHT,
  hidePaddedHeaderRows: true,
  defaultColDef: {
    cellClassRules: compareMissingValueCellClassRules,
  },
};

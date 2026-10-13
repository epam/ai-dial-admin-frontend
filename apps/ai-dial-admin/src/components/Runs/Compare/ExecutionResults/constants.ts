import { CellClassParams, ColDef } from 'ag-grid-community';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

export {
  DURATION_COLUMN_WIDTH,
  EXTRACTED_COLUMN_MIN_WIDTH,
  fixedWidthColDef,
  HTTP_COLUMN_WIDTH,
  NO_FILTER_COL_DEF,
  NUMBER_FILTER_COL_DEF,
  REQUEST_INDEX_COLUMN_WIDTH,
  RUN_INDEX_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
  TEST_CASE_NAME_COLUMN_WIDTH,
  TEXT_FILTER_COL_DEF,
  TURN_INDEX_COLUMN_WIDTH,
} from '@/src/components/Runs/grid-column-layout';

export const COMPARE_SCORE_COLUMN_MIN_WIDTH = 80;
export const DEFAULT_COMPARE_DELTA_HEADER = 'Delta';

/**
 * Score columns (run 1, run 2, delta) take only the width they need: the grid's default `flex` and
 * size-to-fit would otherwise stretch every metric to share the leftover width.
 */
export const compareScoreColDef: Pick<ColDef, 'width' | 'minWidth' | 'flex' | 'suppressSizeToFit'> = {
  width: COMPARE_SCORE_COLUMN_MIN_WIDTH,
  minWidth: COMPARE_SCORE_COLUMN_MIN_WIDTH,
  flex: 0,
  suppressSizeToFit: true,
};

export const COMPARE_GROUP_HEADER_HEIGHT = 28;

export const EXECUTION_GROUP_HEADER = 'Execution';
export const EXECUTION_STATUS_GROUP_HEADER = 'Execution status';
export const EXTRACTED_GROUP_HEADER = 'Extracted';

export const formatCompareColumnHeader = (runIndex: string, label: string) => `[${runIndex}] ${label}`;

/** Row-level diff box, drawn instead of the per-pair boxes when every visible pair differs. */
export const COMPARE_ROW_DIFF_CLASS = 'compare-row-diff';
export const COMPARE_ROW_DIFF_KIND_CLASS: Record<Exclude<MetricDeltaKind, MetricDeltaKind.Empty>, string> = {
  [MetricDeltaKind.Added]: 'compare-row-diff-improved',
  [MetricDeltaKind.Changed]: 'compare-row-diff-new',
  [MetricDeltaKind.Removed]: 'compare-row-diff-regressed',
};

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

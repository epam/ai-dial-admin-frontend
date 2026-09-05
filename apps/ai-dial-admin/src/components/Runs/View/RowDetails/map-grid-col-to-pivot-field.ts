import {
  ROW_DETAIL_DURATION_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
} from '@/src/components/Runs/Details/RowDetails/constants';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';

const GRID_COL_TO_PIVOT_FIELD: Record<string, string> = {
  status: EXECUTION_STATUS_FIELD_KEY,
  runIndex: ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  http: ROW_DETAIL_HTTP_FIELD_KEY,
  duration: ROW_DETAIL_DURATION_FIELD_KEY,
  [EXECUTION_STATUS_FIELD_KEY]: EXECUTION_STATUS_FIELD_KEY,
  [ROW_DETAIL_RUN_NUMBER_FIELD_KEY]: ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  [ROW_DETAIL_HTTP_FIELD_KEY]: ROW_DETAIL_HTTP_FIELD_KEY,
  [ROW_DETAIL_DURATION_FIELD_KEY]: ROW_DETAIL_DURATION_FIELD_KEY,
};

/** Grid columns that open the panel but have no pivot counterpart. */
const GRID_ONLY_COLUMNS = new Set(['testCaseName', 'totalRequests', 'totalTurns', 'requestIndex', 'turnIndex']);

/**
 * Maps an Execution Result grid colId/field to a pivot fieldKey for scroll-to-column.
 * Returns null for columns that have no pivot counterpart (e.g. testCaseName).
 */
export const mapGridColToPivotField = (colId: string | null | undefined): string | null => {
  if (!colId || GRID_ONLY_COLUMNS.has(colId)) {
    return null;
  }

  const direct = GRID_COL_TO_PIVOT_FIELD[colId];
  if (direct) {
    return direct;
  }

  // Metric columns use `${groupKey}_${leafKey}`. Group keys typically include a space or
  // dotted package name; extracted column ids with underscores stay intact.
  const lastUnderscore = colId.lastIndexOf('_');
  if (lastUnderscore > 0 && lastUnderscore < colId.length - 1) {
    const prefix = colId.slice(0, lastUnderscore);
    if (/\s|\./.test(prefix)) {
      return colId.slice(lastUnderscore + 1);
    }
  }

  // Extracted / input binding columns use the field name as colId.
  return colId;
};

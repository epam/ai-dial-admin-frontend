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
const GRID_ONLY_COLUMNS = new Set([
  'testCaseName',
  'totalRequests',
  'totalTurns',
  'requestIndex',
  'turnIndex',
  'compare_action',
]);

const COMPARE_PREFIXES = ['cmp_', 'delta_'] as const;

/**
 * Strips compare-grid prefixes (`cmp_`, `delta_`) so primary and secondary columns
 * map to the same pivot fieldKey.
 */
const normalizeCompareColId = (colId: string): string => {
  for (const prefix of COMPARE_PREFIXES) {
    if (colId.startsWith(prefix)) {
      return colId.slice(prefix.length);
    }
  }
  return colId;
};

/**
 * Maps an Execution Result / Compare grid colId/field to a pivot fieldKey for scroll-to-column.
 * Returns null for columns that have no pivot counterpart (e.g. testCaseName).
 */
export const mapGridColToPivotField = (colId: string | null | undefined): string | null => {
  if (!colId || GRID_ONLY_COLUMNS.has(colId)) {
    return null;
  }

  const normalized = normalizeCompareColId(colId);
  if (GRID_ONLY_COLUMNS.has(normalized)) {
    return null;
  }

  const direct = GRID_COL_TO_PIVOT_FIELD[normalized];
  if (direct) {
    return direct;
  }

  // Extracted columns: `extracted_${key}` / (after strip) still `extracted_${key}` from cmp_extracted_
  if (normalized.startsWith('extracted_')) {
    return normalized.slice('extracted_'.length);
  }

  // Metric columns use `${groupKey}_${leafKey}`. Group keys typically include a space or
  // dotted package name; extracted column ids with underscores stay intact.
  const lastUnderscore = normalized.lastIndexOf('_');
  if (lastUnderscore > 0 && lastUnderscore < normalized.length - 1) {
    const prefix = normalized.slice(0, lastUnderscore);
    if (/\s|\./.test(prefix)) {
      return normalized.slice(lastUnderscore + 1);
    }
  }

  // Extracted / input binding columns use the field name as colId.
  return normalized;
};

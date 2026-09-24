import {
  ROW_DETAIL_DURATION_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
} from '@/src/components/Runs/Details/RowDetails/constants';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';

const RIGHT_ALIGNED_FIELD_KEYS = new Set<string>([
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_DURATION_FIELD_KEY,
]);

/**
 * Run number, HTTP status, and duration read as short right-aligned figures, unlike the panel's other
 * fields (metric values, extracted columns, request/response bodies), which stay left-aligned text.
 * Keyed on fieldKey rather than `RowDetailField.isNumeric` — that flag drives diffing and column-width
 * tiers, and disagrees with alignment here (`runNumber` is `isNumeric: false`, an index rather than a
 * value to diff numerically).
 */
export const isRightAlignedRowDetailField = (field: Pick<RowDetailField, 'fieldKey'>): boolean =>
  RIGHT_ALIGNED_FIELD_KEYS.has(field.fieldKey);

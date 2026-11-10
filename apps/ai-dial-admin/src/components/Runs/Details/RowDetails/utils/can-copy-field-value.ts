import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';

/**
 * Whether a panel cell offers a Copy button: extracted and test-case text only. Left out are the cells
 * that are not text to copy, or too small to share with a button: a metric (its score popup has its own
 * Copy), a filled score, the status badge, and the short right-aligned run figures (run number, overall
 * score, HTTP status, duration), where the button would cover the value.
 */
export const canCopyFieldValue = (field: RowDetailField, raw: string | null, isFailed: boolean): boolean => {
  const isStatusRow = field.fieldKey === EXECUTION_STATUS_FIELD_KEY;
  const isFilledScore = getScoreFieldValue(raw, field.isScoreIndicator, isFailed) != null;

  return (
    !!raw && !isFailed && !field.isMetric && !isStatusRow && !isFilledScore && !isRightAlignedRowDetailField(field)
  );
};

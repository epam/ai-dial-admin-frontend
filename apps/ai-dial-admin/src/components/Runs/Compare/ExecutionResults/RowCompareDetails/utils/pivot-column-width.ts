import {
  ROW_DETAIL_DURATION_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_PIVOT_DEFAULT_COL_WIDTH,
  ROW_DETAIL_PIVOT_DURATION_COL_WIDTH,
  ROW_DETAIL_PIVOT_HTTP_COL_WIDTH,
  ROW_DETAIL_PIVOT_LEFT_COL_WIDTH,
  ROW_DETAIL_PIVOT_RUN_NUMBER_COL_WIDTH,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  ROW_DETAIL_PIVOT_SCORE_COL_WIDTH,
  ROW_DETAIL_PIVOT_STATUS_COL_WIDTH,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  CompareRowDetailField,
  PivotColumnWidthTier,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { PivotColumn } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/flatten-pivot-fields';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';

const PIVOT_COLUMN_WIDTH_BY_TIER: Record<PivotColumnWidthTier, number> = {
  [PivotColumnWidthTier.Status]: ROW_DETAIL_PIVOT_STATUS_COL_WIDTH,
  [PivotColumnWidthTier.RunNumber]: ROW_DETAIL_PIVOT_RUN_NUMBER_COL_WIDTH,
  [PivotColumnWidthTier.Http]: ROW_DETAIL_PIVOT_HTTP_COL_WIDTH,
  [PivotColumnWidthTier.Duration]: ROW_DETAIL_PIVOT_DURATION_COL_WIDTH,
  [PivotColumnWidthTier.Score]: ROW_DETAIL_PIVOT_SCORE_COL_WIDTH,
  [PivotColumnWidthTier.Default]: ROW_DETAIL_PIVOT_DEFAULT_COL_WIDTH,
};

export const resolvePivotFieldWidthTier = (field: CompareRowDetailField): PivotColumnWidthTier => {
  switch (field.fieldKey) {
    case EXECUTION_STATUS_FIELD_KEY:
      return PivotColumnWidthTier.Status;
    case ROW_DETAIL_RUN_NUMBER_FIELD_KEY:
      return PivotColumnWidthTier.RunNumber;
    case ROW_DETAIL_HTTP_FIELD_KEY:
      return PivotColumnWidthTier.Http;
    case ROW_DETAIL_DURATION_FIELD_KEY:
      return PivotColumnWidthTier.Duration;
    default:
      break;
  }

  if (field.isScoreIndicator) {
    return PivotColumnWidthTier.Score;
  }

  return PivotColumnWidthTier.Default;
};

export const resolvePivotFieldColumnWidth = (field: CompareRowDetailField): number =>
  PIVOT_COLUMN_WIDTH_BY_TIER[resolvePivotFieldWidthTier(field)];

export const getPivotGridTemplateColumns = (columns: PivotColumn[]): string => {
  const fieldColumns = columns.map((column) => `${resolvePivotFieldColumnWidth(column.field)}px`).join(' ');
  return fieldColumns ? `${ROW_DETAIL_PIVOT_LEFT_COL_WIDTH}px ${fieldColumns}` : `${ROW_DETAIL_PIVOT_LEFT_COL_WIDTH}px`;
};

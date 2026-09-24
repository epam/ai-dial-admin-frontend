import { describe, expect, test } from 'vitest';

import {
  ROW_DETAIL_DURATION_FIELD_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
} from '@/src/components/Runs/Details/RowDetails/constants';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const field = (fieldKey: string, overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey,
  label: fieldKey,
  primaryRaw: 'a',
  secondaryRaw: 'b',
  diffKind: MetricDeltaKind.Empty,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

describe('isRightAlignedRowDetailField', () => {
  test.each([ROW_DETAIL_RUN_NUMBER_FIELD_KEY, ROW_DETAIL_HTTP_FIELD_KEY, ROW_DETAIL_DURATION_FIELD_KEY])(
    'returns true for %s',
    (fieldKey) => {
      expect(isRightAlignedRowDetailField(field(fieldKey))).toBe(true);
    },
  );

  test('returns false for an unrelated field, regardless of isNumeric', () => {
    expect(isRightAlignedRowDetailField(field('answer', { isNumeric: false }))).toBe(false);
    expect(isRightAlignedRowDetailField(field('score', { isNumeric: true }))).toBe(false);
  });

  test('run number is right-aligned even though it is not flagged isNumeric', () => {
    expect(isRightAlignedRowDetailField(field(ROW_DETAIL_RUN_NUMBER_FIELD_KEY, { isNumeric: false }))).toBe(true);
  });

  test('a metric field rendered as a ScoreBar is right-aligned', () => {
    expect(isRightAlignedRowDetailField(field('Accuracy_precision', { isScoreIndicator: true }))).toBe(true);
  });

  test('a metric field not rendered as a ScoreBar stays left-aligned', () => {
    expect(isRightAlignedRowDetailField(field('Accuracy_precision', { isScoreIndicator: false }))).toBe(false);
  });
});

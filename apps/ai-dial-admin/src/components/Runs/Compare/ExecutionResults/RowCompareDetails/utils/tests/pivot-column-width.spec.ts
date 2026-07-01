import { describe, expect, test } from 'vitest';

import {
  ROW_DETAIL_PIVOT_DEFAULT_COL_WIDTH,
  ROW_DETAIL_PIVOT_DURATION_COL_WIDTH,
  ROW_DETAIL_PIVOT_HTTP_COL_WIDTH,
  ROW_DETAIL_PIVOT_LEFT_COL_WIDTH,
  ROW_DETAIL_PIVOT_RUN_NUMBER_COL_WIDTH,
  ROW_DETAIL_PIVOT_SCORE_COL_WIDTH,
  ROW_DETAIL_PIVOT_STATUS_COL_WIDTH,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  CompareRowDetailField,
  PivotColumnWidthTier,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { PivotColumn } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/flatten-pivot-fields';
import {
  getPivotGridTemplateColumns,
  resolvePivotFieldColumnWidth,
  resolvePivotFieldWidthTier,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/pivot-column-width';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const field = (fieldKey: string, overrides: Partial<CompareRowDetailField> = {}): CompareRowDetailField => ({
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

const pivotColumn = (fieldKey: string, overrides: Partial<CompareRowDetailField> = {}): PivotColumn => ({
  sectionKey: 'execution',
  sectionLabel: 'Execution',
  isSectionStart: true,
  field: field(fieldKey, overrides),
  hasDelta: false,
});

describe('resolvePivotFieldWidthTier', () => {
  test('maps execution field keys to compact tiers', () => {
    expect(resolvePivotFieldWidthTier(field('executionStatus'))).toBe(PivotColumnWidthTier.Status);
    expect(resolvePivotFieldWidthTier(field('runNumber'))).toBe(PivotColumnWidthTier.RunNumber);
    expect(resolvePivotFieldWidthTier(field('httpStatusCode'))).toBe(PivotColumnWidthTier.Http);
    expect(resolvePivotFieldWidthTier(field('execDurationMs'))).toBe(PivotColumnWidthTier.Duration);
  });

  test('maps score indicators to score tier', () => {
    expect(resolvePivotFieldWidthTier(field('equality', { isScoreIndicator: true }))).toBe(PivotColumnWidthTier.Score);
  });

  test('falls back to default tier for text fields', () => {
    expect(resolvePivotFieldWidthTier(field('answer'))).toBe(PivotColumnWidthTier.Default);
  });
});

describe('resolvePivotFieldColumnWidth', () => {
  test('returns Figma-aligned widths per field type', () => {
    expect(resolvePivotFieldColumnWidth(field('executionStatus'))).toBe(ROW_DETAIL_PIVOT_STATUS_COL_WIDTH);
    expect(resolvePivotFieldColumnWidth(field('httpStatusCode'))).toBe(ROW_DETAIL_PIVOT_HTTP_COL_WIDTH);
    expect(resolvePivotFieldColumnWidth(field('execDurationMs'))).toBe(ROW_DETAIL_PIVOT_DURATION_COL_WIDTH);
    expect(resolvePivotFieldColumnWidth(field('runNumber'))).toBe(ROW_DETAIL_PIVOT_RUN_NUMBER_COL_WIDTH);
    expect(resolvePivotFieldColumnWidth(field('equality', { isScoreIndicator: true }))).toBe(
      ROW_DETAIL_PIVOT_SCORE_COL_WIDTH,
    );
    expect(resolvePivotFieldColumnWidth(field('answer'))).toBe(ROW_DETAIL_PIVOT_DEFAULT_COL_WIDTH);
  });
});

describe('getPivotGridTemplateColumns', () => {
  test('builds fixed per-column grid template from pivot columns', () => {
    const columns = [
      pivotColumn('executionStatus'),
      pivotColumn('httpStatusCode'),
      pivotColumn('equality', { isScoreIndicator: true }),
    ];

    expect(getPivotGridTemplateColumns(columns)).toBe(
      `${ROW_DETAIL_PIVOT_LEFT_COL_WIDTH}px ${ROW_DETAIL_PIVOT_STATUS_COL_WIDTH}px ${ROW_DETAIL_PIVOT_HTTP_COL_WIDTH}px ${ROW_DETAIL_PIVOT_SCORE_COL_WIDTH}px`,
    );
  });

  test('returns only left column width when there are no field columns', () => {
    expect(getPivotGridTemplateColumns([])).toBe(`${ROW_DETAIL_PIVOT_LEFT_COL_WIDTH}px`);
  });
});

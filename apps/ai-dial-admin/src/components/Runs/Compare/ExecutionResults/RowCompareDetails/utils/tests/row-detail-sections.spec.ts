import { describe, expect, test } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import {
  buildRowDetailSections,
  countRowDetailDiffs,
  getCompareRowDetailTitle,
  getFieldDiffKind,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-sections';
import { AnalyticsResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

const primaryResult: AnalyticsResult = {
  id: 'primary-1',
  testCaseId: 'tc-1',
  testCaseName: 'Test Case Alpha',
  runIndex: 10,
  responseStatusCode: 200,
  executionStatus: ExtractionResultStatus.SUCCESS,
  execDurationMs: 100,
  metricValues: {
    Accuracy: { precision: 0.5, recall: null },
  },
  testCaseData: { prompt: 'hello' },
};

const comparedResult: AnalyticsResult = {
  id: 'compared-1',
  testCaseId: 'tc-1',
  testCaseName: 'Test Case Alpha',
  runIndex: 11,
  responseStatusCode: 500,
  executionStatus: ExtractionResultStatus.FAILED,
  execDurationMs: 200,
  metricValues: {
    Accuracy: { precision: 0.8, recall: 0.2 },
  },
  testCaseData: { prompt: 'hello world' },
};

describe('getFieldDiffKind', () => {
  test('returns Added when primary is missing and secondary has a value', () => {
    expect(getFieldDiffKind(null, '0.8', true, true)).toBe(MetricDeltaKind.Added);
  });

  test('returns Removed when primary has a value and secondary is missing', () => {
    expect(getFieldDiffKind('0.5', null, true, true)).toBe(MetricDeltaKind.Removed);
  });

  test('returns Changed when numeric values differ', () => {
    expect(getFieldDiffKind('0.5', '0.8', true, true)).toBe(MetricDeltaKind.Changed);
  });

  test('returns Changed when text values differ', () => {
    expect(getFieldDiffKind('hello', 'hello world', false, true)).toBe(MetricDeltaKind.Changed);
  });

  test('returns Empty when values are equal', () => {
    expect(getFieldDiffKind('hello', 'hello', false, true)).toBe(MetricDeltaKind.Empty);
  });
});

describe('buildRowDetailSections', () => {
  test('builds sections with diff kinds from compared results', () => {
    const sections = buildRowDetailSections(primaryResult, comparedResult);
    const metricSection = sections.find((section) => section.key === 'metric:Accuracy');
    const precisionRow = metricSection?.rows.find((row) => row.fieldKey === 'precision');

    expect(precisionRow?.diffKind).toBe(MetricDeltaKind.Changed);
    expect(precisionRow?.isScoreIndicator).toBe(true);
  });

  test('marks metric rows as metric and execution rows as non-metric', () => {
    const sections = buildRowDetailSections(primaryResult, comparedResult);
    const execDurationRow = sections
      .find((section) => section.key === 'execution')
      ?.rows.find((row) => row.fieldKey === 'execDurationMs');
    const precisionRow = sections
      .find((section) => section.key === 'metric:Accuracy')
      ?.rows.find((row) => row.fieldKey === 'precision');

    expect(execDurationRow?.isMetric).toBe(false);
    expect(precisionRow?.isMetric).toBe(true);
  });

  test('counts diffs across sections', () => {
    const sections = buildRowDetailSections(primaryResult, comparedResult);
    const counts = countRowDetailDiffs(sections);

    expect(counts.changed).toBeGreaterThan(0);
  });
});

describe('getCompareRowDetailTitle', () => {
  test('uses test case name when available', () => {
    expect(getCompareRowDetailTitle(primaryResult)).toBe('Test Case Alpha');
  });

  test('falls back to row index when test case name is missing', () => {
    expect(getCompareRowDetailTitle({ ...primaryResult, testCaseName: undefined })).toBe('Row 11');
  });
});

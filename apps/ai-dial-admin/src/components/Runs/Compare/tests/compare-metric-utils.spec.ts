import { describe, expect, test } from 'vitest';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

import {
  CompareMetricDeltaKind,
  countCompareDiffs,
  formatCompareMetricDelta,
  getCompareMetricDelta,
  roundMetricValue,
} from '../compare-metric-utils';

const makeRow = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  id: 'result-1',
  testCaseId: 'tc-1',
  testCaseName: 'Test Case 1',
  responseStatusCode: 200,
  runIndex: 0,
  executionStatus: ExtractionResultStatus.SUCCESS,
  ...overrides,
});

describe('Runs Compare :: compare-metric-utils', () => {
  test('returns empty when values are equal', () => {
    expect(getCompareMetricDelta(0.5, 0.5)).toEqual({ kind: CompareMetricDeltaKind.Empty });
    expect(getCompareMetricDelta(0.102, 0.102)).toEqual({ kind: CompareMetricDeltaKind.Empty });
  });

  test('returns changed when both values exist and differ', () => {
    expect(getCompareMetricDelta(0, 0.303)).toEqual({
      kind: CompareMetricDeltaKind.Changed,
      value: 0.303,
    });
    expect(getCompareMetricDelta(1, 0.102)).toEqual({
      kind: CompareMetricDeltaKind.Changed,
      value: -0.898,
    });
  });

  test('returns added when primary is missing and secondary exists', () => {
    expect(getCompareMetricDelta(null, 1)).toEqual({ kind: CompareMetricDeltaKind.Added });
  });

  test('returns empty when both values are missing', () => {
    expect(getCompareMetricDelta(null, null)).toEqual({ kind: CompareMetricDeltaKind.Empty });
  });

  test('returns removed when primary exists and secondary is missing', () => {
    expect(getCompareMetricDelta(0.8, null)).toEqual({ kind: CompareMetricDeltaKind.Removed });
  });

  test('formatCompareMetricDelta formats signed values for changed deltas', () => {
    expect(formatCompareMetricDelta({ kind: CompareMetricDeltaKind.Changed, value: 0.303 })).toBe('+0.303');
    expect(formatCompareMetricDelta({ kind: CompareMetricDeltaKind.Changed, value: -0.898 })).toBe('-0.898');
    expect(formatCompareMetricDelta({ kind: CompareMetricDeltaKind.Empty })).toBeNull();
    expect(formatCompareMetricDelta({ kind: CompareMetricDeltaKind.Added })).toBeNull();
    expect(formatCompareMetricDelta({ kind: CompareMetricDeltaKind.Removed })).toBeNull();
  });

  test('roundMetricValue rounds to 3 decimals', () => {
    expect(roundMetricValue(0.1024)).toBe(0.102);
  });
});

describe('Runs Compare :: countCompareDiffs', () => {
  test('counts added, changed, and removed metric diffs', () => {
    const rows = [
      makeRow({
        metricValues: { Accuracy: { precision: 0.5, recall: 0.8 } },
        _compared: {
          ...makeRow(),
          metricValues: { Accuracy: { precision: 0.8, recall: 0.6 } },
        },
      }),
      makeRow({
        metricValues: {},
        _compared: {
          ...makeRow(),
          metricValues: { Accuracy: { f1: 0.9 } },
        },
      }),
    ];

    expect(countCompareDiffs(rows)).toEqual({ improved: 1, changed: 2, regressed: 0 });
  });

  test('counts execution status diff once per row', () => {
    const rows = [
      makeRow({
        executionStatus: ExtractionResultStatus.SUCCESS,
        _compared: { ...makeRow(), executionStatus: ExtractionResultStatus.FAILED },
      }),
    ];

    expect(countCompareDiffs(rows)).toEqual({ improved: 0, changed: 1, regressed: 0 });
  });

  test('does not count equal metric values or matching status', () => {
    const rows = [
      makeRow({
        executionStatus: ExtractionResultStatus.SUCCESS,
        metricValues: { Accuracy: { precision: 0.8 } },
        _compared: {
          ...makeRow(),
          executionStatus: ExtractionResultStatus.SUCCESS,
          metricValues: { Accuracy: { precision: 0.8 } },
        },
      }),
    ];

    expect(countCompareDiffs(rows)).toEqual({ improved: 0, changed: 0, regressed: 0 });
  });

  test('unions metric keys from primary and compared sides', () => {
    const rows = [
      makeRow({
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: {
          ...makeRow(),
          metricValues: { Accuracy: { recall: 0.9 } },
        },
      }),
    ];

    expect(countCompareDiffs(rows)).toEqual({ improved: 1, changed: 0, regressed: 1 });
  });
});

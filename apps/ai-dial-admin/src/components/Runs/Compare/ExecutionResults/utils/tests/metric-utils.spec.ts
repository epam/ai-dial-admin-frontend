import { describe, expect, test } from 'vitest';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

import {
  MetricDeltaKind,
  countCompareDiffs,
  formatMetricDelta,
  getMetricDelta,
  hasCompareRowDiff,
  roundMetricValue,
} from '../metric-utils';

const makeRow = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  id: 'result-1',
  testCaseId: 'tc-1',
  testCaseName: 'Test Case 1',
  responseStatusCode: 200,
  runIndex: 0,
  executionStatus: ExtractionResultStatus.SUCCESS,
  ...overrides,
});

describe('Runs Compare :: metric-utils', () => {
  test('returns empty when values are equal', () => {
    expect(getMetricDelta(0.5, 0.5)).toEqual({ kind: MetricDeltaKind.Empty });
    expect(getMetricDelta(0.102, 0.102)).toEqual({ kind: MetricDeltaKind.Empty });
  });

  test('returns changed when both values exist and differ', () => {
    expect(getMetricDelta(0, 0.303)).toEqual({
      kind: MetricDeltaKind.Changed,
      value: 0.303,
    });
    expect(getMetricDelta(1, 0.102)).toEqual({
      kind: MetricDeltaKind.Changed,
      value: -0.898,
    });
  });

  test('returns added when primary is missing and secondary exists', () => {
    expect(getMetricDelta(null, 1)).toEqual({ kind: MetricDeltaKind.Added });
  });

  test('returns empty when both values are missing', () => {
    expect(getMetricDelta(null, null)).toEqual({ kind: MetricDeltaKind.Empty });
  });

  test('returns removed when primary exists and secondary is missing', () => {
    expect(getMetricDelta(0.8, null)).toEqual({ kind: MetricDeltaKind.Removed });
  });

  test('formatMetricDelta formats signed values for changed deltas', () => {
    expect(formatMetricDelta({ kind: MetricDeltaKind.Changed, value: 0.303 })).toBe('+0.303');
    expect(formatMetricDelta({ kind: MetricDeltaKind.Changed, value: -0.898 })).toBe('-0.898');
    expect(formatMetricDelta({ kind: MetricDeltaKind.Empty })).toBeNull();
    expect(formatMetricDelta({ kind: MetricDeltaKind.Added })).toBeNull();
    expect(formatMetricDelta({ kind: MetricDeltaKind.Removed })).toBeNull();
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

describe('Runs Compare :: hasCompareRowDiff', () => {
  test('returns false when status and metrics match', () => {
    const row = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      metricValues: { Accuracy: { precision: 0.8 } },
      _compared: {
        ...makeRow(),
        executionStatus: ExtractionResultStatus.SUCCESS,
        metricValues: { Accuracy: { precision: 0.8 } },
      },
    });

    expect(hasCompareRowDiff(row)).toBe(false);
  });

  test('returns true when execution status differs', () => {
    const row = makeRow({
      executionStatus: ExtractionResultStatus.SUCCESS,
      _compared: { ...makeRow(), executionStatus: ExtractionResultStatus.FAILED },
    });

    expect(hasCompareRowDiff(row)).toBe(true);
  });

  test('returns true when a metric was added, changed, or removed', () => {
    expect(
      hasCompareRowDiff(
        makeRow({
          metricValues: { Accuracy: { precision: 0.5 } },
          _compared: { ...makeRow(), metricValues: { Accuracy: { precision: 0.8 } } },
        }),
      ),
    ).toBe(true);

    expect(
      hasCompareRowDiff(
        makeRow({
          metricValues: {},
          _compared: { ...makeRow(), metricValues: { Accuracy: { f1: 0.9 } } },
        }),
      ),
    ).toBe(true);

    expect(
      hasCompareRowDiff(
        makeRow({
          metricValues: { Accuracy: { precision: 0.8 } },
          _compared: { ...makeRow(), metricValues: {} },
        }),
      ),
    ).toBe(true);
  });
});

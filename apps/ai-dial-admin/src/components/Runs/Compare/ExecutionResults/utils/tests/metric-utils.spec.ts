import { describe, expect, test } from 'vitest';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

import {
  MetricDeltaKind,
  countCompareDiffs,
  formatMetricDelta,
  formatCompareExtractedCellValue,
  formatCompareMetricCellValue,
  getCompareFieldDelta,
  getCompareRowDurationMs,
  getExecutionStatusDelta,
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

describe('Runs Compare :: getCompareFieldDelta', () => {
  test('returns changed for differing text values', () => {
    expect(getCompareFieldDelta('yes', 'no')).toBe(MetricDeltaKind.Changed);
  });

  test('returns removed when primary has value and secondary is missing', () => {
    expect(getCompareFieldDelta('yes', null)).toBe(MetricDeltaKind.Removed);
  });

  test('returns changed for differing numeric values', () => {
    expect(getCompareFieldDelta(200, 500, { isNumeric: true })).toBe(MetricDeltaKind.Changed);
  });
});

describe('Runs Compare :: getCompareRowDurationMs', () => {
  test('prefers executionInfo duration over execDurationMs', () => {
    expect(
      getCompareRowDurationMs(Object.assign(makeRow({ execDurationMs: 100 }), { executionInfo: { durationMs: 36 } })),
    ).toBe(36);
  });
});

describe('Runs Compare :: formatCompareMetricCellValue', () => {
  test('returns em dash for null and undefined metric values', () => {
    expect(formatCompareMetricCellValue(null)).toBe('—');
    expect(formatCompareMetricCellValue(undefined)).toBe('—');
    expect(formatCompareMetricCellValue(Number.NaN)).toBe('—');
  });

  test('formats numeric metric values to 3 decimals', () => {
    expect(formatCompareMetricCellValue(1)).toBe(1);
    expect(formatCompareMetricCellValue(0.3034)).toBe(0.303);
  });

  test('stringifies non-null object values', () => {
    expect(formatCompareMetricCellValue({ score: 0.5 })).toBe('{"score":0.5}');
  });
});

describe('Runs Compare :: formatCompareExtractedCellValue', () => {
  test('returns em dash for nullish extracted values', () => {
    expect(formatCompareExtractedCellValue(null)).toBe('—');
    expect(formatCompareExtractedCellValue(undefined)).toBe('—');
  });
});

describe('Runs Compare :: execution status delta', () => {
  test('returns removed when primary has status and secondary is error', () => {
    expect(getExecutionStatusDelta(ExtractionResultStatus.SUCCESS, ExtractionResultStatus.ERROR)).toBe(
      MetricDeltaKind.Removed,
    );
  });

  test('returns added when primary is error and secondary has status', () => {
    expect(getExecutionStatusDelta(ExtractionResultStatus.ERROR, ExtractionResultStatus.SUCCESS)).toBe(
      MetricDeltaKind.Added,
    );
  });

  test('returns changed when both runs have visible but different statuses', () => {
    expect(getExecutionStatusDelta(ExtractionResultStatus.SUCCESS, ExtractionResultStatus.FAILED)).toBe(
      MetricDeltaKind.Changed,
    );
  });

  test('returns empty when both runs display error', () => {
    expect(getExecutionStatusDelta(ExtractionResultStatus.ERROR, ExtractionResultStatus.ERROR)).toBe(
      MetricDeltaKind.Empty,
    );
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

  test('counts http, duration, and extracted diffs', () => {
    const rows = [
      makeRow({
        responseStatusCode: 200,
        execDurationMs: 100,
        extractedColumns: { answer: 'yes' },
        _compared: {
          ...makeRow(),
          responseStatusCode: 500,
          execDurationMs: 250,
          extractedColumns: { answer: 'no' },
        },
      }),
    ];

    expect(countCompareDiffs(rows)).toEqual({ improved: 0, changed: 3, regressed: 0 });
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

  test('excludes diffs from hidden execution columns', () => {
    const rows = [
      makeRow({
        responseStatusCode: 200,
        execDurationMs: 100,
        extractedColumns: { answer: 'yes' },
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: {
          ...makeRow(),
          responseStatusCode: 500,
          execDurationMs: 250,
          extractedColumns: { answer: 'no' },
          metricValues: { Accuracy: { precision: 0.8 } },
        },
      }),
    ];

    const hiddenColIds = new Set(['duration', 'cmp_duration', 'http', 'cmp_http']);

    expect(countCompareDiffs(rows, { hiddenColIds })).toEqual({ improved: 0, changed: 2, regressed: 0 });
  });

  test('excludes diffs from hidden metric columns', () => {
    const rows = [
      makeRow({
        responseStatusCode: 200,
        execDurationMs: 100,
        metricValues: { Accuracy: { precision: 0.5 } },
        _compared: {
          ...makeRow(),
          responseStatusCode: 500,
          execDurationMs: 250,
          metricValues: { Accuracy: { precision: 0.8 } },
        },
      }),
    ];

    const hiddenColIds = new Set(['Accuracy_precision', 'cmp_Accuracy_precision', 'delta_Accuracy_precision']);

    expect(countCompareDiffs(rows, { hiddenColIds })).toEqual({ improved: 0, changed: 2, regressed: 0 });
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

  test('returns true for unmatched primary-only rows (_compared null)', () => {
    const row = makeRow({
      executionStatus: ExtractionResultStatus.FAILED,
      metricValues: {},
      _compared: null,
    });

    expect(hasCompareRowDiff(row)).toBe(true);
  });

  test('returns true when http, duration, or extracted values differ', () => {
    expect(
      hasCompareRowDiff(
        makeRow({
          responseStatusCode: 200,
          _compared: { ...makeRow(), responseStatusCode: 500 },
        }),
      ),
    ).toBe(true);

    expect(
      hasCompareRowDiff(
        makeRow({
          execDurationMs: 100,
          _compared: { ...makeRow(), execDurationMs: 250 },
        }),
      ),
    ).toBe(true);

    expect(
      hasCompareRowDiff(
        makeRow({
          extractedColumns: { answer: 'yes' },
          _compared: { ...makeRow(), extractedColumns: { answer: 'no' } },
        }),
      ),
    ).toBe(true);
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

  test('ignores duration diff when execution duration columns are hidden', () => {
    const hiddenColIds = new Set(['duration', 'cmp_duration', 'http', 'cmp_http', 'runIndex', 'cmp_runIndex']);
    const row = makeRow({
      execDurationMs: 100,
      _compared: { ...makeRow(), execDurationMs: 250 },
    });

    expect(hasCompareRowDiff(row)).toBe(true);
    expect(hasCompareRowDiff(row, { hiddenColIds })).toBe(false);
  });

  test('ignores metric diff when metric columns are hidden', () => {
    const hiddenColIds = new Set(['Accuracy_precision', 'cmp_Accuracy_precision', 'delta_Accuracy_precision']);
    const row = makeRow({
      metricValues: { Accuracy: { precision: 0.5 } },
      _compared: { ...makeRow(), metricValues: { Accuracy: { precision: 0.8 } } },
    });

    expect(hasCompareRowDiff(row, { hiddenColIds })).toBe(false);
  });

  test('still counts visible metric diff when other groups are hidden', () => {
    const hiddenColIds = new Set(['duration', 'cmp_duration']);
    const row = makeRow({
      metricValues: { Accuracy: { precision: 0.5 } },
      _compared: { ...makeRow(), metricValues: { Accuracy: { precision: 0.8 } } },
    });

    expect(hasCompareRowDiff(row, { hiddenColIds })).toBe(true);
  });
});

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
  isCompareRowAllMetricsEmpty,
  isCompareRowFullyEmpty,
  isCompareRunExecutionDataEmpty,
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
});

describe('Runs Compare :: isCompareRowAllMetricsEmpty', () => {
  const schema = { 'DIAL RAG Eval: Retrieval': { f1: 0, mrr: 0, recall: 0, precision: 0 } };

  test('returns true when both runs have no values for all schema metrics', () => {
    const row = makeRow({
      _compared: { ...makeRow(), id: 'result-2' },
    });

    expect(isCompareRowAllMetricsEmpty(row, schema)).toBe(true);
  });

  test('returns false when primary run has a metric value', () => {
    const row = makeRow({
      metricValues: { 'DIAL RAG Eval: Retrieval': { f1: 0.143 } },
      _compared: { ...makeRow(), id: 'result-2' },
    });

    expect(isCompareRowAllMetricsEmpty(row, schema)).toBe(false);
  });

  test('returns false when secondary run has a metric value', () => {
    const row = makeRow({
      _compared: {
        ...makeRow(),
        id: 'result-2',
        metricValues: { 'DIAL RAG Eval: Retrieval': { recall: 0.5 } },
      },
    });

    expect(isCompareRowAllMetricsEmpty(row, schema)).toBe(false);
  });

  test('returns true when schema is empty', () => {
    const row = makeRow({
      metricValues: { Accuracy: { precision: 0.8 } },
      _compared: { ...makeRow(), id: 'result-2' },
    });

    expect(isCompareRowAllMetricsEmpty(row, {})).toBe(true);
  });
});

describe('Runs Compare :: isCompareRunExecutionDataEmpty', () => {
  test('returns true when run has no execution fields', () => {
    const row = makeRow({
      runIndex: undefined as unknown as number,
      responseStatusCode: undefined as unknown as number,
    });

    expect(isCompareRunExecutionDataEmpty(row)).toBe(true);
  });

  test('returns false when run index is present', () => {
    expect(isCompareRunExecutionDataEmpty(makeRow({ runIndex: 0 }))).toBe(false);
  });

  test('returns false when http status is present', () => {
    expect(isCompareRunExecutionDataEmpty(makeRow({ responseStatusCode: 200 }))).toBe(false);
  });

  test('returns false when duration is present', () => {
    expect(isCompareRunExecutionDataEmpty(makeRow({ execDurationMs: 250 }))).toBe(false);
  });

  test('returns true for null compared run', () => {
    expect(isCompareRunExecutionDataEmpty(null)).toBe(true);
  });
});

describe('Runs Compare :: isCompareRowFullyEmpty', () => {
  const schema = { 'DIAL RAG Eval: Retrieval': { f1: 0, mrr: 0, recall: 0, precision: 0 } };

  test('returns false when primary run has execution data even if metrics are empty', () => {
    const row = makeRow({
      runIndex: 0,
      responseStatusCode: 200,
      _compared: { ...makeRow(), id: 'result-2', runIndex: undefined as unknown as number },
    });

    expect(isCompareRowFullyEmpty(row, schema)).toBe(false);
  });

  test('returns false when secondary run has execution data', () => {
    const row = makeRow({
      runIndex: undefined as unknown as number,
      responseStatusCode: undefined as unknown as number,
      _compared: { ...makeRow(), id: 'result-2', runIndex: 1, responseStatusCode: 500 },
    });

    expect(isCompareRowFullyEmpty(row, schema)).toBe(false);
  });

  test('returns true only when execution and metrics are empty on both runs', () => {
    const row = makeRow({
      runIndex: undefined as unknown as number,
      responseStatusCode: undefined as unknown as number,
      _compared: {
        ...makeRow(),
        id: 'result-2',
        runIndex: undefined as unknown as number,
        responseStatusCode: undefined as unknown as number,
      },
    });

    expect(isCompareRowFullyEmpty(row, schema)).toBe(true);
  });
});

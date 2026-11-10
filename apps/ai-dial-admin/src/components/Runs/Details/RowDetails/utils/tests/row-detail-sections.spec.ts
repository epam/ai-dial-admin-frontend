import { describe, expect, test } from 'vitest';

import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import {
  buildRowDetailSections,
  countRowDetailDiffs,
  getRowDetailTitle,
  getFieldDiffKind,
} from '@/src/components/Runs/Details/RowDetails/utils/row-detail-sections';
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

  test('carries each run’s metric info onto the field', () => {
    const sections = buildRowDetailSections(
      { ...primaryResult, metricInfos: { Accuracy: { precision: { reason: 'primary reason' } } } },
      { ...comparedResult, metricInfos: { Accuracy: { precision: { verbose_logs: 'secondary logs' } } } },
    );
    const precisionRow = sections
      .find((section) => section.key === 'metric:Accuracy')
      ?.rows.find((row) => row.fieldKey === 'precision');

    expect(precisionRow?.primaryInfo).toEqual({ reason: 'primary reason', logs: null, error: null });
    expect(precisionRow?.secondaryInfo).toEqual({ reason: null, logs: 'secondary logs', error: null });
  });

  test('leaves secondary info empty without a compared result', () => {
    const sections = buildRowDetailSections(
      { ...primaryResult, metricInfos: { Accuracy: { precision: { reason: 'primary reason' } } } },
      null,
    );
    const precisionRow = sections
      .find((section) => section.key === 'metric:Accuracy')
      ?.rows.find((row) => row.fieldKey === 'precision');

    expect(precisionRow?.primaryInfo?.reason).toBe('primary reason');
    expect(precisionRow?.secondaryInfo).toBeUndefined();
  });

  test('orders execution fields as status, run number, overall score, HTTP, duration', () => {
    const sections = buildRowDetailSections(primaryResult, comparedResult);
    const execution = sections.find((section) => section.key === 'execution');

    expect(execution?.rows.map((row) => row.fieldKey)).toEqual([
      'executionStatus',
      'runNumber',
      'overallScore',
      'httpStatusCode',
      'execDurationMs',
    ]);
  });

  describe('overall score field', () => {
    const getScoreRow = (primary: AnalyticsResult, compared: AnalyticsResult | null) =>
      buildRowDetailSections(primary, compared)
        .find((section) => section.key === 'execution')
        ?.rows.find((row) => row.fieldKey === 'overallScore');

    test('shows each side’s test case score, rounded to three decimals', () => {
      const row = getScoreRow({ ...primaryResult, testCaseScore: 0.92857 }, { ...comparedResult, testCaseScore: 0.5 });

      expect(row).toMatchObject({
        label: 'Overall score',
        primaryRaw: '0.929',
        secondaryRaw: '0.5',
        isNumeric: true,
        isScoreIndicator: false,
        isMetric: false,
      });
    });

    test('keeps a zero score and leaves a missing one empty', () => {
      expect(getScoreRow({ ...primaryResult, testCaseScore: 0 }, null)?.primaryRaw).toBe('0');
      expect(getScoreRow({ ...primaryResult, testCaseScore: null }, null)?.primaryRaw).toBeNull();
      expect(getScoreRow(primaryResult, null)?.primaryRaw).toBeNull();
    });

    test('carries each run’s threshold on the field, for the above/below icon', () => {
      const sections = buildRowDetailSections(primaryResult, comparedResult, [], undefined, {
        primary: 0.6,
        compared: 0.8,
      });
      const row = sections
        .find((section) => section.key === 'execution')
        ?.rows.find((r) => r.fieldKey === 'overallScore');

      expect(row).toMatchObject({ primaryThreshold: 0.6, secondaryThreshold: 0.8 });
    });

    test('carries no threshold when none is given, and none on other execution rows', () => {
      const execution = buildRowDetailSections(primaryResult, null).find((section) => section.key === 'execution');

      expect(execution?.rows.find((r) => r.fieldKey === 'overallScore')?.primaryThreshold).toBeUndefined();
      expect(execution?.rows.find((r) => r.fieldKey === 'httpStatusCode')).not.toHaveProperty('primaryThreshold');
    });

    test('has no compared value for a single run', () => {
      const row = getScoreRow({ ...primaryResult, testCaseScore: 0.7 }, null);

      expect(row?.secondaryRaw).toBeNull();
      expect(row?.diffKind).toBe(MetricDeltaKind.Empty);
    });

    test('marks differing scores as a diff and equal ones as none', () => {
      const changed = getScoreRow({ ...primaryResult, testCaseScore: 0.5 }, { ...comparedResult, testCaseScore: 0.7 });
      const same = getScoreRow({ ...primaryResult, testCaseScore: 0.7 }, { ...comparedResult, testCaseScore: 0.7 });
      const removed = getScoreRow({ ...primaryResult, testCaseScore: 0.7 }, { ...comparedResult, testCaseScore: null });

      expect(changed?.diffKind).toBe(MetricDeltaKind.Changed);
      expect(same?.diffKind).toBe(MetricDeltaKind.Empty);
      expect(removed?.diffKind).toBe(MetricDeltaKind.Removed);
    });
  });

  test('places metric sections immediately after execution', () => {
    const sections = buildRowDetailSections(primaryResult, comparedResult);

    expect(sections.map((section) => section.key)).toEqual(['execution', 'metric:Accuracy', 'testCaseData']);
  });

  test('orders metric sections by metricValues insertion order, not alphabetically', () => {
    const sections = buildRowDetailSections(
      {
        ...primaryResult,
        metricValues: {
          'correct-capital1': { score: 1 },
          'answer-conciseness': { score: 0.5 },
        },
      },
      null,
    );

    expect(sections.filter((section) => section.key.startsWith('metric:')).map((section) => section.key)).toEqual([
      'metric:correct-capital1',
      'metric:answer-conciseness',
    ]);
  });

  test('orders metric sections to match the Extraction Result grid group order', () => {
    const sections = buildRowDetailSections(
      {
        ...primaryResult,
        metricValues: {
          'Exact Match': { exact_match: 1 },
          'DeepEval: Answer Relevancy': { score: 0.8 },
        },
      },
      null,
      ['DeepEval: Answer Relevancy', 'Exact Match'],
    );

    expect(sections.filter((section) => section.key.startsWith('metric:')).map((section) => section.key)).toEqual([
      'metric:DeepEval: Answer Relevancy',
      'metric:Exact Match',
    ]);
  });

  test('preserves extracted schema field order in row detail sections', () => {
    const sections = buildRowDetailSections({ ...primaryResult, extractedColumns: { answer: 'Berlin' } }, null, [], {
      extractedColumns: { answer: 'Berlin', verification: 'Yes', history: [] },
    });

    const extracted = sections.find((section) => section.key === 'extractedColumns');
    expect(extracted?.rows.map((row) => row.fieldKey)).toEqual(['answer', 'verification', 'history']);
  });

  test('includes schema metric groups and extracted fields missing from the selected row as null', () => {
    const sections = buildRowDetailSections(
      {
        ...primaryResult,
        metricValues: { Accuracy: { precision: 0.5 } },
        extractedColumns: { answer: 'Berlin' },
      },
      null,
      ['Exact Match', 'Accuracy'],
      {
        metricValues: { 'Exact Match': { exact_match: 1 }, Accuracy: { precision: 0.5 } },
        extractedColumns: { answer: 'Berlin', verification: 'Yes' },
      },
    );

    const exactMatch = sections.find((section) => section.key === 'metric:Exact Match');
    expect(exactMatch?.rows.find((row) => row.fieldKey === 'exact_match')?.primaryRaw).toBeNull();

    const extracted = sections.find((section) => section.key === 'extractedColumns');
    expect(extracted?.rows.find((row) => row.fieldKey === 'verification')?.primaryRaw).toBeNull();
    expect(extracted?.rows.find((row) => row.fieldKey === 'answer')?.primaryRaw).toBe('Berlin');
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

  // The shape the eval service returns for a metric that failed to evaluate (run 3080, DeepEval: G-Eval).
  test('carries the leaf-level error of a failed metric and marks the field failed', () => {
    const failedResult: AnalyticsResult = {
      ...primaryResult,
      metricValues: { 'DeepEval: G-Eval': { score: null as never } },
      metricInfos: { 'DeepEval: G-Eval': { score: { error: '422 Unprocessable Content' } } },
    };

    const sections = buildRowDetailSections(failedResult, null);
    const scoreRow = sections
      .find((section) => section.key === 'metric:DeepEval: G-Eval')
      ?.rows.find((row) => row.fieldKey === 'score');

    expect(scoreRow?.primaryFailed).toBe(true);
    expect(scoreRow?.primaryInfo).toEqual({ reason: null, logs: null, error: '422 Unprocessable Content' });
  });
});

describe('getRowDetailTitle', () => {
  test('uses test case name when available', () => {
    expect(getRowDetailTitle(primaryResult)).toBe('Test Case Alpha');
  });

  test('falls back to row index when test case name is missing', () => {
    expect(getRowDetailTitle({ ...primaryResult, testCaseName: undefined })).toBe('Row 11');
  });
});

import { describe, expect, test } from 'vitest';

import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import {
  fillEmptySegmentsFromOverallScore,
  parseRunTestCaseSegments,
} from '@/src/components/TestSuites/Trends/TestCases/utils/parse-test-cases-segments';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

const runOrder: TrendsRunPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: 0.5, durationMs: 10, isFailed: false },
  { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, overallScore: 0.6, durationMs: 20, isFailed: false },
];

describe('parseRunTestCaseSegments', () => {
  test('maps SUCCESS passed true/false and ERROR into segments aligned to runOrder', () => {
    const segments = parseRunTestCaseSegments(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: true,
            count: 8,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: false,
            count: 2,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.ERROR,
            passed: null,
            count: 1,
          },
          {
            test_suite_run_id: 'run-2',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: true,
            count: 5,
          },
        ],
      },
      runOrder,
    );

    expect(segments).toEqual([
      { runId: 'run-1', runName: 'Run#1', above: 8, below: 2, errorOrNa: 1, total: 11 },
      { runId: 'run-2', runName: 'Run#2', above: 5, below: 0, errorOrNa: 0, total: 5 },
    ]);
  });

  test('counts SUCCESS with null passed as errorOrNa when threshold is set', () => {
    const segments = parseRunTestCaseSegments(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: null,
            count: 3,
          },
        ],
      },
      runOrder,
      true,
    );

    expect(segments[0]).toMatchObject({ above: 0, below: 0, errorOrNa: 3, total: 3 });
  });

  test('counts all SUCCESS as Completed (above) when threshold is unset', () => {
    const segments = parseRunTestCaseSegments(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: null,
            count: 3,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: false,
            count: 2,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.ERROR,
            passed: null,
            count: 1,
          },
        ],
      },
      runOrder,
      false,
    );

    expect(segments[0]).toMatchObject({ above: 5, below: 0, errorOrNa: 1, total: 6 });
  });

  test('treats string boolean passed values like booleans', () => {
    const segments = parseRunTestCaseSegments(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: 'true',
            count: 2,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: 'false',
            count: 1,
          },
        ],
      },
      runOrder,
    );

    expect(segments[0]).toMatchObject({ above: 2, below: 1, errorOrNa: 0, total: 3 });
  });

  test('returns zero segments for runs missing from the result', () => {
    const segments = parseRunTestCaseSegments({ rows: [] }, runOrder);

    expect(segments).toEqual([
      { runId: 'run-1', runName: 'Run#1', above: 0, below: 0, errorOrNa: 0, total: 0 },
      { runId: 'run-2', runName: 'Run#2', above: 0, below: 0, errorOrNa: 0, total: 0 },
    ]);
  });

  test('returns zeros for null result', () => {
    expect(parseRunTestCaseSegments(null, runOrder)).toEqual([
      { runId: 'run-1', runName: 'Run#1', above: 0, below: 0, errorOrNa: 0, total: 0 },
      { runId: 'run-2', runName: 'Run#2', above: 0, below: 0, errorOrNa: 0, total: 0 },
    ]);
  });
});

describe('fillEmptySegmentsFromOverallScore', () => {
  test('fills empty runs from overall score vs threshold without changing scored runs', () => {
    const empty = parseRunTestCaseSegments({ rows: [] }, runOrder);
    const filled = fillEmptySegmentsFromOverallScore(empty, runOrder, 0.55);

    expect(filled[0]).toMatchObject({ above: 0, below: 1, total: 1 });
    expect(filled[1]).toMatchObject({ above: 1, below: 0, total: 1 });
  });

  test('marks failed empty runs as errorOrNa', () => {
    const failedOrder: TrendsRunPoint[] = [{ ...runOrder[0], isFailed: true, overallScore: 0.9 }];
    const empty = parseRunTestCaseSegments({ rows: [] }, failedOrder);
    const filled = fillEmptySegmentsFromOverallScore(empty, failedOrder, 0.5);

    expect(filled[0]).toMatchObject({ errorOrNa: 1, above: 0, below: 0, total: 1 });
  });

  test('fills as Completed (above) when threshold is unset but overall score exists', () => {
    const empty = parseRunTestCaseSegments({ rows: [] }, runOrder, false);
    const filled = fillEmptySegmentsFromOverallScore(empty, runOrder, null);

    expect(filled[0]).toMatchObject({ above: 1, below: 0, errorOrNa: 0, total: 1 });
    expect(filled[1]).toMatchObject({ above: 1, below: 0, errorOrNa: 0, total: 1 });
  });

  test('marks empty runs with no overall score as Error or N/A', () => {
    const unscored: TrendsRunPoint[] = [{ ...runOrder[0], overallScore: null }];
    const unscoredEmpty = parseRunTestCaseSegments({ rows: [] }, unscored);
    expect(fillEmptySegmentsFromOverallScore(unscoredEmpty, unscored, 0.5)[0]).toMatchObject({
      errorOrNa: 1,
      above: 0,
      below: 0,
      total: 1,
    });
    expect(fillEmptySegmentsFromOverallScore(unscoredEmpty, unscored, null)[0]).toMatchObject({
      errorOrNa: 1,
      total: 1,
    });
  });
});

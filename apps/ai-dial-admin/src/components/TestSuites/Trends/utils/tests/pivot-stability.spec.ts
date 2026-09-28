import { describe, expect, test } from 'vitest';

import {
  getStabilityTestCaseColId,
  pivotStabilitySummaries,
} from '@/src/components/TestSuites/Trends/utils/pivot-stability';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

const runOrder: TrendsRunPoint[] = [
  { runId: 'run-1', runName: 'Run#1', computedAtMs: 1, overallScore: 0.5, durationMs: 10, isFailed: false },
  { runId: 'run-2', runName: 'Run#2', computedAtMs: 2, overallScore: 0.6, durationMs: 20, isFailed: false },
];

describe('pivotStabilitySummaries', () => {
  test('builds run rows × test-case columns with scores', () => {
    const matrix = pivotStabilitySummaries(
      [
        { test_suite_run_id: 'run-1', test_case_name: 'case-b', score: 0.4, passed: false },
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.9, passed: true },
        { test_suite_run_id: 'run-2', test_case_name: 'case-a', score: 0.8, passed: true },
      ],
      runOrder,
    );

    expect(matrix.headerLabels).toEqual(['case-a', 'case-b']);
    expect(matrix.rows.map((row) => row.label)).toEqual(['Run#1', 'Run#2']);
    expect(matrix.rows[0].values[getStabilityTestCaseColId('case-a')]).toBe(0.9);
    expect(matrix.rows[0].values[getStabilityTestCaseColId('case-b')]).toBe(0.4);
    expect(matrix.rows[1].values[getStabilityTestCaseColId('case-a')]).toBe(0.8);
    expect(matrix.cellMeta[matrix.rows[0].id][getStabilityTestCaseColId('case-a')].passed).toBe(true);
  });

  test('marks missing test case × run pairs as undefined gaps', () => {
    const matrix = pivotStabilitySummaries(
      [{ test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.5, passed: true }],
      runOrder,
    );

    expect(matrix.rows[0].values[getStabilityTestCaseColId('case-a')]).toBe(0.5);
    expect(matrix.rows[1].values[getStabilityTestCaseColId('case-a')]).toBeUndefined();
    expect(matrix.cellMeta[matrix.rows[1].id][getStabilityTestCaseColId('case-a')]).toBeUndefined();
  });

  test('last row wins for duplicate test case and run pairs', () => {
    const matrix = pivotStabilitySummaries(
      [
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.1, passed: false },
        { test_suite_run_id: 'run-1', test_case_name: 'case-a', score: 0.99, passed: true },
      ],
      runOrder,
    );

    expect(matrix.rows[0].values[getStabilityTestCaseColId('case-a')]).toBe(0.99);
    expect(matrix.cellMeta[matrix.rows[0].id][getStabilityTestCaseColId('case-a')].passed).toBe(true);
  });
});

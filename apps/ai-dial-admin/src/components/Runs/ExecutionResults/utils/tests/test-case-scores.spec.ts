import { describe, expect, test } from 'vitest';

import { TestCaseThresholdStatus } from '@/src/components/Runs/ExecutionResults/models';
import {
  buildTestCaseScoreLookup,
  buildTestCaseScoresQuery,
  getTestCaseThresholdStatus,
  parseTestCaseScores,
} from '@/src/components/Runs/ExecutionResults/utils/test-case-scores';
import { TEST_CASE_EVAL_SCORES_ENTITY } from '@/src/components/Runs/Summary/constants';
import { ExprType, PageType, QueryMode, ValueType } from '@/src/models/evaluation/structured-query';

describe('test-case score utilities', () => {
  test('builds a row query for all score fields and requested runs', () => {
    const query = buildTestCaseScoresQuery(['run-1', 'run-2']);

    expect(query.entity).toBe(TEST_CASE_EVAL_SCORES_ENTITY);
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.select).toHaveLength(5);
    expect(query.filter).toEqual(
      expect.objectContaining({
        args: expect.arrayContaining([
          {
            type: ExprType.Array,
            items: [
              { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-1' },
              { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-2' },
            ],
          },
        ]),
      }),
    );
    expect(query.page).toEqual({
      type: PageType.Offset,
      offset: 0,
      limit: 10_000,
      include_total: false,
    });
  });

  test('parses valid summaries and normalizes invalid score and passed values', () => {
    expect(
      parseTestCaseScores({
        rows: [
          {
            test_suite_run_id: 'run-1',
            test_case_id: 'case-1',
            test_case_name: 'Case 1',
            score: 0.8,
            passed: 'true',
          },
          { test_suite_run_id: 'run-1', test_case_name: 'Case 2', score: 'bad', passed: null },
          { test_suite_run_id: null, score: 0.2 },
        ],
      }),
    ).toEqual([
      {
        runId: 'run-1',
        testCaseId: 'case-1',
        testCaseName: 'Case 1',
        score: 0.8,
        passed: true,
      },
      {
        runId: 'run-1',
        testCaseId: undefined,
        testCaseName: 'Case 2',
        score: null,
        passed: null,
      },
    ]);
  });

  test('matches by id before falling back to name within the requested run', () => {
    const summaries = [
      { runId: 'run-1', testCaseId: 'case-1', testCaseName: 'Same', score: 0.9, passed: true },
      { runId: 'run-2', testCaseId: 'case-2', testCaseName: 'Same', score: 0.2, passed: false },
    ];
    const findScore = buildTestCaseScoreLookup(summaries);

    expect(findScore('run-1', 'case-1', 'Same')?.score).toBe(0.9);
    expect(findScore('run-2', 'missing', 'Same')?.score).toBe(0.2);
    expect(findScore('run-3', 'case-1', 'Same')).toBeUndefined();
  });

  test('uses the last score when the query contains duplicate run and test-case rows', () => {
    const summaries = [
      { runId: 'run-1', testCaseId: 'case-1', score: 0.2, passed: false },
      { runId: 'run-1', testCaseId: 'case-1', score: 0.9, passed: true },
    ];

    expect(buildTestCaseScoreLookup(summaries)('run-1', 'case-1')?.score).toBe(0.9);
  });

  test('evaluates configured thresholds including zero and exact equality', () => {
    expect(getTestCaseThresholdStatus(0, 0)).toBe(TestCaseThresholdStatus.Pass);
    expect(getTestCaseThresholdStatus(0.5, 0.5)).toBe(TestCaseThresholdStatus.Pass);
    expect(getTestCaseThresholdStatus(0.49, 0.5)).toBe(TestCaseThresholdStatus.Fail);
    expect(getTestCaseThresholdStatus(null, 0.5)).toBe(TestCaseThresholdStatus.NotApplicable);
    expect(getTestCaseThresholdStatus(0.5, undefined)).toBe(TestCaseThresholdStatus.NotApplicable);
  });
});

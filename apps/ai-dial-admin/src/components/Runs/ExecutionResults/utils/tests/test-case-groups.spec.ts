import { describe, expect, test } from 'vitest';

import { ExecutionResultRowType, TestCaseThresholdStatus } from '@/src/components/Runs/ExecutionResults/models';
import {
  projectCompareExecutionResultScores,
  projectCompareExecutionResultGroups,
  projectExecutionResultScores,
  projectExecutionResultGroups,
  sortExecutionResultGroupRows,
} from '@/src/components/Runs/ExecutionResults/utils/test-case-groups';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const result = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'result-1',
  testCaseId: 'case-1',
  testCaseName: 'Case 1',
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

describe('test-case result grouping', () => {
  test('orders child rows by run, request, and turn while preserving tied source order', () => {
    const rows = [
      result({ id: 'fourth', runIndex: 1, requestIndex: 0, turnIndex: 0 }),
      result({ id: 'third', runIndex: 0, requestIndex: 1, turnIndex: 0 }),
      result({ id: 'second', runIndex: 0, requestIndex: 0, turnIndex: 1 }),
      result({ id: 'first-a', runIndex: 0, requestIndex: undefined, turnIndex: undefined }),
      result({ id: 'first-b', runIndex: 0, requestIndex: 0, turnIndex: 0 }),
    ];

    expect(sortExecutionResultGroupRows(rows).map((row) => row.id)).toEqual([
      'first-a',
      'first-b',
      'second',
      'third',
      'fourth',
    ]);
  });

  test('projects every test case as an expanded group with score and threshold status', () => {
    const rows = [
      result({ id: 'run-2', runIndex: 1 }),
      result({ id: 'run-1', runIndex: 0 }),
      result({ id: 'other', testCaseId: 'case-2', testCaseName: 'Case 2' }),
    ];
    const projected = projectExecutionResultGroups(
      rows,
      new Set(),
      [{ runId: 'run-id', testCaseId: 'case-1', score: 0.8, passed: true }],
      'run-id',
      0.7,
    );

    expect(projected.map((row) => [row.resultRowType, row.id])).toEqual([
      [ExecutionResultRowType.Group, undefined],
      [ExecutionResultRowType.Result, 'run-1'],
      [ExecutionResultRowType.Result, 'run-2'],
      [ExecutionResultRowType.Group, undefined],
      [ExecutionResultRowType.Result, 'other'],
    ]);
    expect(projected[0]).toEqual(
      expect.objectContaining({
        isExpanded: true,
        testCaseScore: 0.8,
        thresholdStatus: TestCaseThresholdStatus.Pass,
      }),
    );
  });

  test('keeps a collapsed group parent and omits its child rows', () => {
    const projected = projectExecutionResultGroups([result()], new Set(['case-1']), [], 'run-id');

    expect(projected).toHaveLength(1);
    expect(projected[0]).toEqual(
      expect.objectContaining({ resultRowType: ExecutionResultRowType.Group, isExpanded: false }),
    );
  });

  test('adds score and threshold status directly to single-execution rows', () => {
    const projected = projectExecutionResultScores(
      [result()],
      [{ runId: 'run-id', testCaseId: 'case-1', score: 0.8, passed: true }],
      'run-id',
      0.7,
    );

    expect(projected[0]).toEqual(
      expect.objectContaining({
        id: 'result-1',
        resultRowType: ExecutionResultRowType.Result,
        testCaseScore: 0.8,
        thresholdStatus: TestCaseThresholdStatus.Pass,
      }),
    );
  });

  test('projects independent score and threshold outcomes for compared runs', () => {
    const primary = result();
    const projected = projectCompareExecutionResultGroups(
      [{ ...primary, _compared: result({ id: 'compared', testCaseId: 'detached-id' }) }],
      new Set(),
      [
        { runId: 'primary', testCaseId: 'case-1', score: 0.7, passed: true },
        { runId: 'compared', testCaseName: 'Case 1', score: 0.3, passed: false },
      ],
      'primary',
      'compared',
      0.7,
      0.5,
    );

    expect(projected[0]).toEqual(
      expect.objectContaining({
        primaryScore: 0.7,
        primaryThresholdStatus: TestCaseThresholdStatus.Pass,
        comparedScore: 0.3,
        comparedThresholdStatus: TestCaseThresholdStatus.Fail,
      }),
    );
  });

  test('adds paired scores and threshold statuses directly to single-execution comparison rows', () => {
    const primary = result();
    const projected = projectCompareExecutionResultScores(
      [{ ...primary, _compared: result({ id: 'compared', testCaseId: 'detached-id' }) }],
      [
        { runId: 'primary', testCaseId: 'case-1', score: 0.7, passed: true },
        { runId: 'compared', testCaseName: 'Case 1', score: 0.3, passed: false },
      ],
      'primary',
      'compared',
      0.7,
      0.5,
    );

    expect(projected[0]).toEqual(
      expect.objectContaining({
        id: 'result-1',
        resultRowType: ExecutionResultRowType.Result,
        primaryScore: 0.7,
        primaryThresholdStatus: TestCaseThresholdStatus.Pass,
        comparedScore: 0.3,
        comparedThresholdStatus: TestCaseThresholdStatus.Fail,
      }),
    );
  });
});

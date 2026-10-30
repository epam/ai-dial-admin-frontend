import { describe, expect, test } from 'vitest';

import {
  ExecutionResultRowType,
  GroupedAnalyticsResult,
  GroupedCompareAnalyticsRow,
  TestCaseThresholdStatus,
} from '@/src/components/Runs/ExecutionResults/models';
import {
  getExecutionResultGroupKey,
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
  test('allows synthetic rows without an HTTP response status', () => {
    const group: GroupedAnalyticsResult = {
      resultRowType: ExecutionResultRowType.Group,
      groupKey: 'case-1',
      runIndex: 0,
    };
    const compareGroup: GroupedCompareAnalyticsRow = { ...group, primaryScore: 0.5 };

    expect(group.responseStatusCode).toBeUndefined();
    expect(compareGroup.responseStatusCode).toBeUndefined();
  });

  describe.each([
    {
      name: 'single-run results',
      project: (rows: AnalyticsResult[], collapsed: ReadonlySet<string>) =>
        projectExecutionResultGroups(rows, collapsed, [], 'run-id'),
    },
    {
      name: 'comparison results',
      project: (rows: AnalyticsResult[], collapsed: ReadonlySet<string>) =>
        projectCompareExecutionResultGroups(rows, collapsed, [], 'primary', 'compared'),
    },
  ])('$name', ({ project }) => {
    test('keeps unidentified rows standalone and visible even when the empty key is collapsed', () => {
      const unidentified = result({ id: undefined, testCaseId: undefined, testCaseName: undefined });
      const emptyIdentifiers = result({ id: '', testCaseId: '', testCaseName: '', responseStatusCode: 500 });
      const rows = [unidentified, result(), emptyIdentifiers];
      const projected = project(rows, new Set(['', 'case-1']));

      expect(projected).toEqual([
        { ...unidentified, resultRowType: ExecutionResultRowType.Result, groupKey: '' },
        expect.objectContaining({ resultRowType: ExecutionResultRowType.Group, groupKey: 'case-1' }),
        { ...emptyIdentifiers, resultRowType: ExecutionResultRowType.Result, groupKey: '' },
      ]);
      expect(rows).toEqual([unidentified, result(), emptyIdentifiers]);
    });

    test('omits HTTP status on group headers and preserves it on child rows', () => {
      const projected = project([result({ responseStatusCode: 500 })], new Set());

      expect(projected[0].resultRowType).toBe(ExecutionResultRowType.Group);
      expect(projected[0]).not.toHaveProperty('responseStatusCode');
      expect(projected[1].responseStatusCode).toBe(500);
    });

    test('uses name and result ID fallbacks without merging distinct identities', () => {
      const rows = [
        result({ testCaseId: undefined, testCaseName: 'By name', id: 'first' }),
        result({ testCaseId: undefined, testCaseName: 'By name', id: 'second' }),
        result({ testCaseId: undefined, testCaseName: undefined, id: 'third' }),
        result({ testCaseId: undefined, testCaseName: undefined, id: 'fourth' }),
      ];
      const projected = project(rows, new Set());

      expect(
        projected.filter((row) => row.resultRowType === ExecutionResultRowType.Group).map((row) => row.groupKey),
      ).toEqual(['By name', 'third', 'fourth']);
      expect(
        projected.filter((row) => row.resultRowType === ExecutionResultRowType.Result).map((row) => row.id),
      ).toEqual(['first', 'second', 'third', 'fourth']);
    });

    test('returns no rows for empty results', () => {
      expect(project([], new Set())).toEqual([]);
    });
  });

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

describe('getExecutionResultGroupKey', () => {
  test('prefers the test case ID, then its name, then the result ID', () => {
    expect(getExecutionResultGroupKey(result())).toBe('case-1');
    expect(getExecutionResultGroupKey(result({ testCaseId: undefined }))).toBe('Case 1');
    expect(getExecutionResultGroupKey(result({ testCaseId: undefined, testCaseName: undefined }))).toBe('result-1');
  });

  test('signals that grouping is unavailable when all identifiers are missing', () => {
    expect(getExecutionResultGroupKey({})).toBe('');
    expect(getExecutionResultGroupKey({ testCaseId: '', testCaseName: '', id: '' })).toBe('');
  });
});

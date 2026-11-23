import { describe, expect, test } from 'vitest';

import {
  ExtractionRowType,
  GroupedResultRow,
  isTestCaseGroupRow,
  TestCaseGroupRow,
} from '@/src/components/Runs/models';
import { buildTestCaseGroupRows, getTestCaseGroupKey } from '@/src/components/Runs/utils/test-case-groups';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const result = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

const NONE = new Set<string>();

const describeRow = (row: ReturnType<typeof buildTestCaseGroupRows>[number]): string =>
  isTestCaseGroupRow(row) ? `group:${row.testCaseName}` : `${row.id}`;

describe('getTestCaseGroupKey', () => {
  test('prefers the test case id', () => {
    expect(getTestCaseGroupKey({ testCaseId: 'tc-1', testCaseName: 'name', id: 'r1' })).toBe('tc-1');
  });

  test('falls back to the name when there is no id', () => {
    expect(getTestCaseGroupKey({ testCaseName: 'name', id: 'r1' })).toBe('name');
  });

  test('falls back to the result id when there is neither id nor name', () => {
    expect(getTestCaseGroupKey({ id: 'r1' })).toBe('r1');
  });

  test('returns an empty key when nothing identifies the row', () => {
    expect(getTestCaseGroupKey({})).toBe('');
  });
});

describe('buildTestCaseGroupRows', () => {
  test('returns no rows for no results', () => {
    expect(buildTestCaseGroupRows([], NONE)).toEqual([]);
  });

  test('puts each test case behind its group row, with no other test case in between', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'w1', testCaseId: 'weather', testCaseName: 'test-weather' }),
        result({ id: 'c1', testCaseId: 'context', testCaseName: 'test-context' }),
        result({ id: 'w2', testCaseId: 'weather', testCaseName: 'test-weather', runIndex: 1 }),
      ],
      NONE,
    );

    expect(rows.map(describeRow)).toEqual(['group:test-context', 'c1', 'group:test-weather', 'w1', 'w2']);
  });

  test('orders groups alphabetically by test case name', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'a', testCaseName: 'test-weather' }),
        result({ id: 'b', testCaseName: 'test-context' }),
        result({ id: 'c', testCaseName: 'alpha' }),
      ],
      NONE,
    );

    expect(rows.filter(isTestCaseGroupRow).map((row) => row.testCaseName)).toEqual([
      'alpha',
      'test-context',
      'test-weather',
    ]);
  });

  test('orders groups of the same name by key so the order is deterministic', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'b', testCaseId: 'tc-b', testCaseName: 'same' }),
        result({ id: 'a', testCaseId: 'tc-a', testCaseName: 'same' }),
      ],
      NONE,
    );

    expect(rows.filter(isTestCaseGroupRow).map((row) => row.groupKey)).toEqual(['tc-a', 'tc-b']);
  });

  test('puts a group of results without a name first', () => {
    const rows = buildTestCaseGroupRows([result({ id: 'named', testCaseName: 'a' }), result({ id: 'nameless' })], NONE);

    expect(rows.map(describeRow)).toEqual(['group:undefined', 'nameless', 'group:a', 'named']);
  });

  test('orders the results of a group by run, then request, then turn', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'run2-req1-turn1', testCaseName: 'tc', runIndex: 1, requestIndex: 0, turnIndex: 0 }),
        result({ id: 'run1-req2-turn1', testCaseName: 'tc', runIndex: 0, requestIndex: 1, turnIndex: 0 }),
        result({ id: 'run1-req1-turn2', testCaseName: 'tc', runIndex: 0, requestIndex: 0, turnIndex: 1 }),
        result({ id: 'run1-req1-turn1', testCaseName: 'tc', runIndex: 0, requestIndex: 0, turnIndex: 0 }),
      ],
      NONE,
    );

    expect(rows.slice(1).map(describeRow)).toEqual([
      'run1-req1-turn1',
      'run1-req1-turn2',
      'run1-req2-turn1',
      'run2-req1-turn1',
    ]);
  });

  test('treats a missing request or turn index as zero', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'turn1', testCaseName: 'tc', turnIndex: 1 }),
        result({ id: 'no-turn', testCaseName: 'tc' }),
        result({ id: 'turn0', testCaseName: 'tc', turnIndex: 0, requestIndex: 0 }),
      ],
      NONE,
    );

    expect(rows.slice(1).map(describeRow)).toEqual(['no-turn', 'turn0', 'turn1']);
  });

  test('keeps the source order of results equal on run, request and turn', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'first', testCaseName: 'tc' }),
        result({ id: 'second', testCaseName: 'tc' }),
        result({ id: 'third', testCaseName: 'tc' }),
      ],
      NONE,
    );

    expect(rows.slice(1).map(describeRow)).toEqual(['first', 'second', 'third']);
  });

  test('keeps only the group row of a collapsed group', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'c1', testCaseId: 'context', testCaseName: 'test-context' }),
        result({ id: 'w1', testCaseId: 'weather', testCaseName: 'test-weather' }),
      ],
      new Set(['context']),
    );

    expect(rows.map(describeRow)).toEqual(['group:test-context', 'group:test-weather', 'w1']);
    expect((rows[0] as TestCaseGroupRow).isExpanded).toBe(false);
    expect((rows[1] as TestCaseGroupRow).isExpanded).toBe(true);
  });

  test('ignores collapsed keys that match no group', () => {
    const rows = buildTestCaseGroupRows([result({ id: 'a', testCaseName: 'tc' })], new Set(['unknown']));

    expect(rows.map(describeRow)).toEqual(['group:tc', 'a']);
  });

  test('gives the group row the score shared by its results', () => {
    const [group] = buildTestCaseGroupRows(
      [
        result({ id: 'a', testCaseName: 'tc', testCaseScore: 0.7 }),
        result({ id: 'b', testCaseName: 'tc', testCaseScore: 0.7, runIndex: 1 }),
      ],
      NONE,
    );

    expect((group as TestCaseGroupRow).testCaseScore).toBe(0.7);
  });

  test('keeps a missing score missing and a zero score zero', () => {
    const rows = buildTestCaseGroupRows(
      [
        result({ id: 'a', testCaseName: 'no-score', testCaseScore: null }),
        result({ id: 'b', testCaseName: 'zero', testCaseScore: 0 }),
      ],
      NONE,
    );

    const groups = rows.filter(isTestCaseGroupRow);
    expect(groups.map((group) => group.testCaseScore)).toEqual([null, 0]);
  });

  test('tags result rows with their type and group key, keeping their own fields', () => {
    const rows = buildTestCaseGroupRows(
      [result({ id: 'a', testCaseId: 'tc-1', testCaseName: 'tc', testCaseScore: 1 })],
      NONE,
    );

    expect(rows[1]).toEqual({
      ...result({ id: 'a', testCaseId: 'tc-1', testCaseName: 'tc', testCaseScore: 1 }),
      rowType: ExtractionRowType.Result,
      groupKey: 'tc-1',
    } satisfies GroupedResultRow);
  });

  test('builds a group row with no run, request, turn or id', () => {
    const [group] = buildTestCaseGroupRows([result({ id: 'a', testCaseName: 'tc', runIndex: 3 })], NONE);

    expect(group).toEqual({
      rowType: ExtractionRowType.Group,
      groupKey: 'tc',
      testCaseName: 'tc',
      testCaseScore: undefined,
      isExpanded: true,
    });
  });

  test('does not mutate the rows it is given', () => {
    const input = [result({ id: 'b', testCaseName: 'tc', runIndex: 1 }), result({ id: 'a', testCaseName: 'tc' })];
    const snapshot = structuredClone(input);

    buildTestCaseGroupRows(input, NONE);

    expect(input).toEqual(snapshot);
  });
});

describe('isTestCaseGroupRow', () => {
  test.each([
    ['a group row', { rowType: ExtractionRowType.Group }, true],
    ['a result row', { rowType: ExtractionRowType.Result }, false],
    ['a plain result', { id: 'r1' }, false],
    ['null', null, false],
    ['undefined', undefined, false],
  ])('answers for %s', (_name, row, expected) => {
    expect(isTestCaseGroupRow(row)).toBe(expected);
  });
});

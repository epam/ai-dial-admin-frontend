import { describe, expect, test } from 'vitest';

import {
  aggregateValidity,
  demoteToSingle,
  expandTestCasesToRows,
  getPerTurnFieldNames,
  groupTestCaseRows,
  projectGroupsToGridRows,
  promoteToMultiTurn,
  readGroupKey,
  readTurnIndex,
  renumberTurns,
  reorderTurns,
  selectPerTurnFields,
  selectSharedFields,
} from '../test-case-grouping';
import { TestCaseGroup } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { GridRowType } from '@/src/types/grid-row-type';
import { TestCaseRow } from '@/src/types/test-case-row';

describe('getPerTurnFieldNames', () => {
  test('should return empty set when schema is undefined', () => {
    expect(getPerTurnFieldNames(undefined)).toEqual(new Set());
  });

  test('should return empty set when schema is null', () => {
    expect(getPerTurnFieldNames(null)).toEqual(new Set());
  });

  test('should return only field names marked perTurn true', () => {
    const schema = [
      { name: 'prompt', perTurn: true },
      { name: 'expected', perTurn: false },
      { name: 'model' },
    ] as TestCaseSchema[];

    expect(getPerTurnFieldNames(schema)).toEqual(new Set(['prompt']));
  });

  test('should return empty set when schema array is empty', () => {
    expect(getPerTurnFieldNames([])).toEqual(new Set());
  });
});

describe('selectSharedFields / selectPerTurnFields', () => {
  const data = { prompt: 'hi', model: 'gpt-4', temperature: 0.5 };
  const perTurnFields = new Set(['prompt']);

  test('should partition per-turn fields out of shared fields', () => {
    expect(selectSharedFields(data, perTurnFields)).toEqual({ model: 'gpt-4', temperature: 0.5 });
  });

  test('should select only per-turn fields', () => {
    expect(selectPerTurnFields(data, perTurnFields)).toEqual({ prompt: 'hi' });
  });

  test('should be complementary — shared and per-turn together reconstruct the original data', () => {
    const shared = selectSharedFields(data, perTurnFields);
    const perTurn = selectPerTurnFields(data, perTurnFields);

    expect({ ...shared, ...perTurn }).toEqual(data);
    expect(Object.keys(shared).length + Object.keys(perTurn).length).toBe(Object.keys(data).length);
  });

  test('should return empty objects for undefined data', () => {
    expect(selectSharedFields(undefined, perTurnFields)).toEqual({});
    expect(selectPerTurnFields(undefined, perTurnFields)).toEqual({});
  });

  test('should treat every field as shared when perTurnFields is empty', () => {
    expect(selectSharedFields(data, new Set())).toEqual(data);
    expect(selectPerTurnFields(data, new Set())).toEqual({});
  });
});

describe('readTurnIndex', () => {
  test('should read a plain number', () => {
    expect(readTurnIndex({ _turnIndex: 3 })).toBe(3);
  });

  test('should read a numeric string', () => {
    expect(readTurnIndex({ _turnIndex: '3' })).toBe(3);
  });

  test('should treat 0 as present, not absent', () => {
    expect(readTurnIndex({ _turnIndex: 0 })).toBe(0);
  });

  test('should treat "0" as present, not absent', () => {
    expect(readTurnIndex({ _turnIndex: '0' })).toBe(0);
  });

  test('should return null when _turnIndex is absent', () => {
    expect(readTurnIndex({})).toBeNull();
  });

  test('should return null for an empty string', () => {
    expect(readTurnIndex({ _turnIndex: '' })).toBeNull();
  });

  test('should return null for a whitespace-only string', () => {
    expect(readTurnIndex({ _turnIndex: '   ' })).toBeNull();
  });

  test('should return null for non-numeric garbage', () => {
    expect(readTurnIndex({ _turnIndex: 'abc' })).toBeNull();
  });

  test('should return null for NaN', () => {
    expect(readTurnIndex({ _turnIndex: NaN })).toBeNull();
  });

  test('should return null for Infinity', () => {
    expect(readTurnIndex({ _turnIndex: Infinity })).toBeNull();
    expect(readTurnIndex({ _turnIndex: -Infinity })).toBeNull();
  });

  test('should truncate a float number', () => {
    expect(readTurnIndex({ _turnIndex: 2.7 })).toBe(2);
  });

  test('should truncate a float numeric string', () => {
    expect(readTurnIndex({ _turnIndex: '2.7' })).toBe(2);
  });
});

describe('readGroupKey', () => {
  test('should return the case id for a turn row', () => {
    expect(readGroupKey({ id: 'case-1', _turnIndex: 0 })).toBe('case-1');
  });

  test('should return null for a single row (no _turnIndex)', () => {
    expect(readGroupKey({ id: 'case-1' })).toBeNull();
  });

  test('should return null when id is not a string, even with a turn index', () => {
    expect(readGroupKey({ id: 42, _turnIndex: 0 })).toBeNull();
  });

  test('should return null when id is an empty string, even with a turn index', () => {
    expect(readGroupKey({ id: '', _turnIndex: 0 })).toBeNull();
  });
});

describe('groupTestCaseRows', () => {
  test('should group turn rows sharing an id and keep case order by first appearance', () => {
    const rows: TestCaseRow[] = [
      { id: 'A', testCaseName: 'CaseA' },
      { id: 'B', _turnIndex: 1, testCaseName: 'CaseB-t1', data: { x: 2 } },
      { id: 'B', _turnIndex: 0, testCaseName: 'CaseB-t0', data: { x: 1 } },
      { id: 'C', testCaseName: 'CaseC' },
    ];

    const groups = groupTestCaseRows(rows);

    expect(groups.map((g) => g.key)).toEqual(['A', 'B', 'C']);
    expect(groups[0].isMulti).toBe(false);
    expect(groups[1].isMulti).toBe(true);
    expect(groups[2].isMulti).toBe(false);
  });

  test('should sort turns by _turnIndex even when the input is out of order', () => {
    const rows: TestCaseRow[] = [
      { id: 'B', _turnIndex: 2, data: { x: 3 } },
      { id: 'B', _turnIndex: 0, data: { x: 1 } },
      { id: 'B', _turnIndex: 1, data: { x: 2 } },
    ];

    const [group] = groupTestCaseRows(rows);

    expect(group.turns.map((t) => t._turnIndex)).toEqual([0, 1, 2]);
    expect(group.turns.map((t) => (t.data as { x: number }).x)).toEqual([1, 2, 3]);
  });

  test("should take a group's testCaseName from turn 0 after sorting, not first-encountered turn", () => {
    const rows: TestCaseRow[] = [
      { id: 'B', _turnIndex: 1, testCaseName: 'from-turn-1' },
      { id: 'B', _turnIndex: 0, testCaseName: 'from-turn-0' },
    ];

    const [group] = groupTestCaseRows(rows);

    expect(group.testCaseName).toBe('from-turn-0');
  });

  test('should key single rows by their own id', () => {
    const rows: TestCaseRow[] = [{ id: 'single-1', testCaseName: 'Solo' }];

    const [group] = groupTestCaseRows(rows);

    expect(group.key).toBe('single-1');
    expect(group.isMulti).toBe(false);
    expect(group.turns).toEqual([rows[0]]);
  });

  test('should handle mixed single and multi-turn input', () => {
    const rows: TestCaseRow[] = [
      { id: 'single-1' },
      { id: 'multi-1', _turnIndex: 0 },
      { id: 'multi-1', _turnIndex: 1 },
      { id: 'single-2' },
    ];

    const groups = groupTestCaseRows(rows);

    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.key)).toEqual(['single-1', 'multi-1', 'single-2']);
    expect(groups[1].turns).toHaveLength(2);
  });

  test('should return an empty array for empty input', () => {
    expect(groupTestCaseRows([])).toEqual([]);
  });
});

describe('expandTestCasesToRows :: scoped by schema', () => {
  const schema = [{ name: 'prompt', perTurn: true }, { name: 'persona' }] as TestCaseSchema[];

  const multiTurnCase = {
    id: 'case-1',
    data: { persona: 'analyst' },
    multiTurnData: [{ prompt: 'first' }, { prompt: 'second' }],
  };

  test('should read a per-turn field from its own turn and a shared field from data', () => {
    const rows = expandTestCasesToRows([multiTurnCase], schema);

    expect(rows.map((row) => row.data)).toEqual([
      { persona: 'analyst', prompt: 'first' },
      { persona: 'analyst', prompt: 'second' },
    ]);
  });

  test('should drop a per-turn field whose value is still stored as shared', () => {
    const staleShared = { id: 'case-1', data: { prompt: 'was shared' }, multiTurnData: [{}, {}] };

    const rows = expandTestCasesToRows([staleShared], schema);

    expect(rows.map((row) => row.data)).toEqual([{}, {}]);
    expect(rows.every((row) => row.prompt === undefined)).toBe(true);
  });

  test('should drop a shared field whose value is still stored per turn', () => {
    const stalePerTurn = { id: 'case-1', data: {}, multiTurnData: [{ persona: 'analyst' }, { persona: 'critic' }] };

    const rows = expandTestCasesToRows([stalePerTurn], schema);

    expect(rows.map((row) => row.data)).toEqual([{}, {}]);
  });

  test('should leave a single-turn case unfiltered, since it stores every field in data', () => {
    const singleTurn = { id: 'case-2', data: { prompt: 'only', persona: 'analyst' } };

    const rows = expandTestCasesToRows([singleTurn], schema);

    expect(rows).toHaveLength(1);
    expect(rows[0].data).toEqual({ prompt: 'only', persona: 'analyst' });
  });

  test('should merge both maps unfiltered when no schema is supplied', () => {
    const rows = expandTestCasesToRows([multiTurnCase]);

    expect(rows.map((row) => row.data)).toEqual([
      { persona: 'analyst', prompt: 'first' },
      { persona: 'analyst', prompt: 'second' },
    ]);
  });

  test('should ignore turn maps when the schema is loaded but scopes nothing per turn', () => {
    const rows = expandTestCasesToRows([multiTurnCase], []);

    expect(rows.map((row) => row.data)).toEqual([{ persona: 'analyst' }, { persona: 'analyst' }]);
  });

  test('should flatten the scoped map onto the row as well as into data', () => {
    const rows = expandTestCasesToRows([multiTurnCase], schema);

    expect(rows[0].prompt).toBe('first');
    expect(rows[1].prompt).toBe('second');
    expect(rows[0].persona).toBe('analyst');
  });
});

describe('renumberTurns', () => {
  test('should produce contiguous 0..n-1 indices in input order', () => {
    const turns: TestCaseRow[] = [{ label: 'A', _turnIndex: 5 }, { label: 'B', _turnIndex: 9 }, { label: 'C' }];

    const result = renumberTurns(turns);

    expect(result.map((t) => t._turnIndex)).toEqual([0, 1, 2]);
    expect(result.map((t) => t.label)).toEqual(['A', 'B', 'C']);
  });

  test('should return an empty array for empty input', () => {
    expect(renumberTurns([])).toEqual([]);
  });
});

describe('promoteToMultiTurn / demoteToSingle round trip', () => {
  test('should return an equivalent row with no _turnIndex key after a round trip', () => {
    const original: TestCaseRow = { id: 'case-1', testCaseName: 'Case', data: { a: 1 } };

    const promoted = promoteToMultiTurn(original);
    expect(promoted._turnIndex).toBe(0);

    const demoted = demoteToSingle(promoted);

    expect(demoted).toEqual(original);
    expect('_turnIndex' in demoted).toBe(false);
  });
});

describe('reorderTurns', () => {
  const makeTurns = (): TestCaseRow[] => [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }];

  test('should move a turn and renumber contiguously', () => {
    const result = reorderTurns(makeTurns(), 0, 2);

    expect(result.map((t) => t.label)).toEqual(['B', 'C', 'A', 'D']);
    expect(result.map((t) => t._turnIndex)).toEqual([0, 1, 2, 3]);
  });

  test('should be a no-op reorder (but still renumber) when from === to', () => {
    const result = reorderTurns(makeTurns(), 1, 1);

    expect(result.map((t) => t.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(result.map((t) => t._turnIndex)).toEqual([0, 1, 2, 3]);
  });

  test('should be a no-op reorder when from is out of range', () => {
    const resultNegative = reorderTurns(makeTurns(), -1, 2);
    const resultTooLarge = reorderTurns(makeTurns(), 4, 2);

    expect(resultNegative.map((t) => t.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(resultNegative.map((t) => t._turnIndex)).toEqual([0, 1, 2, 3]);
    expect(resultTooLarge.map((t) => t.label)).toEqual(['A', 'B', 'C', 'D']);
  });

  test('should be a no-op reorder when to is out of range', () => {
    const resultNegative = reorderTurns(makeTurns(), 1, -1);
    const resultTooLarge = reorderTurns(makeTurns(), 1, 4);

    expect(resultNegative.map((t) => t.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(resultTooLarge.map((t) => t.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(resultTooLarge.map((t) => t._turnIndex)).toEqual([0, 1, 2, 3]);
  });
});

describe('aggregateValidity', () => {
  test('should be valid when every turn is valid', () => {
    const result = aggregateValidity([{ valid: true }, { valid: true }]);

    expect(result.valid).toBe(true);
    expect(result.validationWarnings).toEqual([]);
  });

  test('should be invalid when one turn is invalid', () => {
    const result = aggregateValidity([{ valid: true }, { valid: false }]);

    expect(result.valid).toBe(false);
  });

  test('should concatenate warnings across turns in order', () => {
    const warnA = { code: 'A', message: 'a', path: 'data.a', fieldName: 'a' };
    const warnB = { code: 'B', message: 'b', path: 'data.b', fieldName: 'b' };

    const result = aggregateValidity([{ validationWarnings: [warnA] }, { validationWarnings: [warnB] }]);

    expect(result.validationWarnings).toEqual([warnA, warnB]);
  });

  test('should treat rows with no valid field as valid, and with no warnings as empty', () => {
    const result = aggregateValidity([{}, {}]);

    expect(result.valid).toBe(true);
    expect(result.validationWarnings).toEqual([]);
  });

  test('should state a warning repeated across every turn only once', () => {
    const warning = { code: 'A', message: 'a', path: 'data.a', fieldName: 'a' };

    const result = aggregateValidity([
      { validationWarnings: [warning] },
      { validationWarnings: [warning] },
      { validationWarnings: [warning] },
    ]);

    expect(result.validationWarnings).toEqual([warning]);
  });

  test('should keep warnings that share a message but differ by path', () => {
    const warnFirst = { code: 'A', message: 'a', path: 'data.first', fieldName: 'a' };
    const warnSecond = { code: 'A', message: 'a', path: 'data.second', fieldName: 'a' };

    const result = aggregateValidity([{ validationWarnings: [warnFirst, warnSecond] }]);

    expect(result.validationWarnings).toEqual([warnFirst, warnSecond]);
  });

  test('should keep the first occurrence when deduplicating', () => {
    const warnA = { code: 'A', message: 'a', path: 'data.a', fieldName: 'a' };
    const warnB = { code: 'B', message: 'b', path: 'data.b', fieldName: 'b' };

    const result = aggregateValidity([{ validationWarnings: [warnA, warnB] }, { validationWarnings: [warnB, warnA] }]);

    expect(result.validationWarnings).toEqual([warnA, warnB]);
  });
});

describe('projectGroupsToGridRows', () => {
  const multiGroup: TestCaseGroup = {
    key: 'multi-1',
    isMulti: true,
    testCaseName: 'Multi case',
    turns: [
      { id: 'multi-1', _turnIndex: 0, data: { a: 1 } },
      { id: 'multi-1', _turnIndex: 1, data: { a: 2 } },
    ],
  };

  const singleGroup: TestCaseGroup = {
    key: 'single-1',
    isMulti: false,
    testCaseName: 'Single case',
    turns: [{ id: 'single-1', data: { a: 1 } }],
  };

  test('should render a collapsed multi-turn group as a single GROUP row with no TURN rows', () => {
    const rows = projectGroupsToGridRows([multiGroup], new Set(), false);

    expect(rows).toHaveLength(1);
    expect(rows[0].rowType).toBe(GridRowType.GROUP);
    expect(rows[0].groupKey).toBe('multi-1');
    expect(rows[0].turnCount).toBe(2);
    expect(rows[0].expanded).toBe(false);
  });

  test('should render an expanded group as GROUP followed by its 1-based TURN rows', () => {
    const rows = projectGroupsToGridRows([multiGroup], new Set(['multi-1']), false);

    expect(rows).toHaveLength(3);
    expect(rows[0].rowType).toBe(GridRowType.GROUP);
    expect(rows[0].expanded).toBe(true);
    expect(rows[1].rowType).toBe(GridRowType.TURN);
    expect(rows[1].turnNumber).toBe(1);
    expect(rows[2].rowType).toBe(GridRowType.TURN);
    expect(rows[2].turnNumber).toBe(2);
  });

  test('should carry the case turn count on every TURN row so boundary turns are identifiable', () => {
    const rows = projectGroupsToGridRows([multiGroup], new Set(['multi-1']), false);

    expect(rows.filter((row) => row.rowType === GridRowType.TURN).map((row) => row.turnCount)).toEqual([2, 2]);
  });

  test('should drop GROUP rows and emit every turn flat while searching', () => {
    const rows = projectGroupsToGridRows([multiGroup], new Set(), true);

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.rowType === GridRowType.TURN)).toBe(true);
    expect(rows.map((row) => row.turnNumber)).toEqual([1, 2]);
  });

  test('should mark the flattened TURN rows so they can carry the case identity themselves', () => {
    const rows = projectGroupsToGridRows([multiGroup], new Set(), true);

    expect(rows.map((row) => row.isFlattened)).toEqual([true, true]);
    expect(rows.map((row) => row.testCaseName)).toEqual(['Multi case', 'Multi case']);
  });

  test('should not mark the TURN rows of an expanded group as flattened, the GROUP row above carries the identity', () => {
    const rows = projectGroupsToGridRows([multiGroup], new Set(['multi-1']), false);

    expect(rows.filter((row) => row.rowType === GridRowType.TURN).map((row) => row.isFlattened)).toEqual([
      false,
      false,
    ]);
  });

  test('should always render single cases as SINGLE regardless of expansion or searching', () => {
    const collapsed = projectGroupsToGridRows([singleGroup], new Set(), false);
    const expanded = projectGroupsToGridRows([singleGroup], new Set(['single-1']), false);
    const searching = projectGroupsToGridRows([singleGroup], new Set(), true);

    expect(collapsed).toHaveLength(1);
    expect(collapsed[0].rowType).toBe(GridRowType.SINGLE);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].rowType).toBe(GridRowType.SINGLE);
    expect(searching).toHaveLength(1);
    expect(searching[0].rowType).toBe(GridRowType.SINGLE);
  });

  test('should return an empty array for empty groups', () => {
    expect(projectGroupsToGridRows([], new Set(), false)).toEqual([]);
  });
});

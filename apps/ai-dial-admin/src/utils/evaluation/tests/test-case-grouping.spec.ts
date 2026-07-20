import { describe, test, expect } from 'vitest';

import { GridRowType, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import {
  aggregateValidity,
  demoteToSingle,
  groupTestCaseRows,
  projectGroupsToGridRows,
  promoteToMultiTurn,
  readMultiTurnId,
  readTurnIndex,
  regroupSortedRows,
  renumberTurns,
  reorderTurns,
} from '../test-case-grouping';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

const turn = (id: string, multiTurnId: string | null, turnIndex: number | null, extra: TestCaseRow = {}): TestCaseRow => ({
  id,
  testCaseName: `case-${multiTurnId ?? id}`,
  data: { message: `m-${id}` },
  multiTurnId,
  turnIndex,
  valid: true,
  ...extra,
});

describe('readMultiTurnId / readTurnIndex', () => {
  test('reads non-empty trimmed multiTurnId, null otherwise', () => {
    expect(readMultiTurnId({ multiTurnId: ' c1 ' })).toBe('c1');
    expect(readMultiTurnId({ multiTurnId: '' })).toBeNull();
    expect(readMultiTurnId({})).toBeNull();
  });

  test('reads numeric and numeric-string turnIndex, including 0', () => {
    expect(readTurnIndex({ turnIndex: 0 })).toBe(0);
    expect(readTurnIndex({ turnIndex: '2' })).toBe(2);
    expect(readTurnIndex({ turnIndex: '' })).toBeNull();
    expect(readTurnIndex({})).toBeNull();
  });
});

describe('groupTestCaseRows', () => {
  test('groups rows sharing a multiTurnId and sorts by turnIndex', () => {
    const rows = [turn('b', 'conv', 1), turn('a', 'conv', 0)];
    const groups = groupTestCaseRows(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0].isMulti).toBe(true);
    expect(groups[0].turns.map((t) => t.id)).toEqual(['a', 'b']);
  });

  test('rows without multiTurnId are single-turn cases', () => {
    const groups = groupTestCaseRows([turn('s1', null, null)]);
    expect(groups[0].isMulti).toBe(false);
    expect(groups[0].key).toBe('s1');
    expect(groups[0].turns).toHaveLength(1);
  });

  test('preserves first-appearance order across singles and groups', () => {
    const rows = [turn('s1', null, null), turn('m1', 'conv', 0), turn('s2', null, null), turn('m2', 'conv', 1)];
    const groups = groupTestCaseRows(rows);
    expect(groups.map((g) => g.key)).toEqual(['s1', 'conv', 's2']);
  });

  test('turns with missing turnIndex sort last, keeping relative order', () => {
    const rows = [turn('x', 'conv', null), turn('y', 'conv', 0)];
    const groups = groupTestCaseRows(rows);
    expect(groups[0].turns.map((t) => t.id)).toEqual(['y', 'x']);
  });
});

describe('renumberTurns / reorderTurns', () => {
  test('renumber assigns contiguous 0..n-1', () => {
    const result = renumberTurns([turn('a', 'c', 5), turn('b', 'c', 9)]);
    expect(result.map((t) => t.turnIndex)).toEqual([0, 1]);
  });

  test('reorder moves a turn and renumbers', () => {
    const result = reorderTurns([turn('a', 'c', 0), turn('b', 'c', 1), turn('d', 'c', 2)], 2, 0);
    expect(result.map((t) => t.id)).toEqual(['d', 'a', 'b']);
    expect(result.map((t) => t.turnIndex)).toEqual([0, 1, 2]);
  });

  test('reorder is a no-op (still renumbered) for out-of-range indices', () => {
    const result = reorderTurns([turn('a', 'c', 3)], 0, 5);
    expect(result.map((t) => t.turnIndex)).toEqual([0]);
  });
});

describe('promoteToMultiTurn / demoteToSingle', () => {
  test('promote attaches multiTurnId and turnIndex 0', () => {
    const promoted = promoteToMultiTurn(turn('s', null, null), 'new-conv');
    expect(promoted.multiTurnId).toBe('new-conv');
    expect(promoted.turnIndex).toBe(0);
  });

  test('demote strips multi-turn keys', () => {
    const demoted = demoteToSingle(turn('a', 'conv', 0));
    expect(demoted.multiTurnId).toBeNull();
    expect(demoted.turnIndex).toBeNull();
  });
});

describe('aggregateValidity', () => {
  test('invalid when any turn is invalid; warnings concatenated', () => {
    const rows = [
      turn('a', 'c', 0, { valid: true }),
      turn('b', 'c', 1, { valid: false, validationWarnings: [{ message: 'bad' }] }),
    ];
    const result = aggregateValidity(rows);
    expect(result.valid).toBe(false);
    expect(result.validationWarnings).toEqual([{ message: 'bad' }]);
  });

  test('valid when all turns valid', () => {
    expect(aggregateValidity([turn('a', 'c', 0)]).valid).toBe(true);
  });
});

describe('projectGroupsToGridRows', () => {
  const groups = groupTestCaseRows([
    turn('m1', 'conv', 0),
    turn('m2', 'conv', 1),
    turn('s1', null, null),
  ]);

  test('collapsed by default: group summary + single, no turn rows', () => {
    const rows = projectGroupsToGridRows(groups, new Set(), false);
    expect(rows.map((r) => r.rowType)).toEqual([GridRowType.GROUP, GridRowType.SINGLE]);
    expect(rows[0].turnCount).toBe(2);
    expect(rows[0].expanded).toBe(false);
  });

  test('expanded group reveals turn rows with 1-based turnNumber', () => {
    const rows = projectGroupsToGridRows(groups, new Set(['conv']), false);
    expect(rows.map((r) => r.rowType)).toEqual([
      GridRowType.GROUP,
      GridRowType.TURN,
      GridRowType.TURN,
      GridRowType.SINGLE,
    ]);
    expect(rows[1].turnNumber).toBe(1);
    expect(rows[2].turnNumber).toBe(2);
  });

  test('search mode flattens to turn/single rows without group rows', () => {
    const rows = projectGroupsToGridRows(groups, new Set(), true);
    expect(rows.map((r) => r.rowType)).toEqual([GridRowType.TURN, GridRowType.TURN, GridRowType.SINGLE]);
    expect(rows.every((r) => r.rowType !== GridRowType.GROUP)).toBe(true);
  });

  test('defaultExpanded=true: multi-turn group is expanded on load with no toggled keys', () => {
    const rows = projectGroupsToGridRows(groups, new Set(), false, true);
    expect(rows.map((r) => r.rowType)).toEqual([
      GridRowType.GROUP,
      GridRowType.TURN,
      GridRowType.TURN,
      GridRowType.SINGLE,
    ]);
    expect(rows[0].expanded).toBe(true);
  });

  test('defaultExpanded=true: a toggled key collapses that group', () => {
    const rows = projectGroupsToGridRows(groups, new Set(['conv']), false, true);
    expect(rows.map((r) => r.rowType)).toEqual([GridRowType.GROUP, GridRowType.SINGLE]);
    expect(rows[0].expanded).toBe(false);
  });

  describe('singlesFirst', () => {
    // A multi-turn conversation that appears BEFORE a single-turn case in source order.
    const mixed = groupTestCaseRows([turn('m1', 'conv', 0), turn('m2', 'conv', 1), turn('s1', null, null)]);

    test('floats single-turn cases above multi-turn ones, keeping expanded turns beneath the group', () => {
      const rows = projectGroupsToGridRows(mixed, new Set(), false, true, true);
      expect(rows.map((r) => r.rowType)).toEqual([
        GridRowType.SINGLE,
        GridRowType.GROUP,
        GridRowType.TURN,
        GridRowType.TURN,
      ]);
    });

    test('floats single-turn cases to the top in search (flattened) mode too', () => {
      const rows = projectGroupsToGridRows(mixed, new Set(), true, true, true);
      expect(rows.map((r) => r.rowType)).toEqual([GridRowType.SINGLE, GridRowType.TURN, GridRowType.TURN]);
    });

    test('preserves first-appearance order within each partition', () => {
      const many = groupTestCaseRows([
        turn('mA', 'convA', 0),
        turn('sX', null, null),
        turn('mB', 'convB', 0),
        turn('sY', null, null),
      ]);
      const rows = projectGroupsToGridRows(many, new Set(), false, false, true);
      expect(rows.map((r) => r.groupKey)).toEqual(['sX', 'sY', 'convA', 'convB']);
    });

    test('off by default: source order is unchanged', () => {
      const rows = projectGroupsToGridRows(mixed, new Set(), false, true);
      expect(rows[0].rowType).toBe(GridRowType.GROUP);
    });
  });
});

describe('regroupSortedRows', () => {
  const group = (key: string): GroupedGridRow => ({ id: key, rowType: GridRowType.GROUP, groupKey: key });
  const turnRow = (id: string, key: string, turnNumber: number): GroupedGridRow => ({
    id,
    rowType: GridRowType.TURN,
    groupKey: key,
    turnNumber,
  });
  const single = (id: string): GroupedGridRow => ({ id, rowType: GridRowType.SINGLE, groupKey: id });

  test('pulls scattered turn rows back under their group in turnNumber order', () => {
    // A sort scattered the turns of group A and B and reordered the groups.
    const sorted = [
      group('B'),
      turnRow('a2', 'A', 2),
      group('A'),
      turnRow('b1', 'B', 1),
      turnRow('a1', 'A', 1),
    ];
    const result = regroupSortedRows(sorted);
    expect(result.map((r) => r.id)).toEqual(['B', 'b1', 'A', 'a1', 'a2']);
  });

  test('keeps single rows in their sorted position', () => {
    const sorted = [single('s1'), group('A'), turnRow('a1', 'A', 1), single('s2')];
    const result = regroupSortedRows(sorted);
    expect(result.map((r) => r.id)).toEqual(['s1', 'A', 'a1', 's2']);
  });

  test('flat list with no group rows is returned unchanged', () => {
    const sorted = [turnRow('a1', 'A', 1), single('s1'), turnRow('a2', 'A', 2)];
    const result = regroupSortedRows(sorted);
    expect(result).toBe(sorted);
  });
});

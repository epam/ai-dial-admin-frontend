import { describe, expect, it } from 'vitest';
import {
  groupTestCaseRows,
  readGroupKey,
  readTurnIndex,
  promoteToMultiTurn,
  demoteToSingle,
  reorderTurns,
  projectGroupsToGridRows,
} from '@/src/utils/evaluation/test-case-grouping';
import { GridRowType } from '@/src/models/evaluation/test-case-grouping';

describe('test-case-grouping (array model)', () => {
  it('reads group key from id only when _turnIndex is present', () => {
    expect(readGroupKey({ id: 'c1', _turnIndex: 0 })).toBe('c1');
    expect(readGroupKey({ id: 'c1', _turnIndex: 2 })).toBe('c1');
    expect(readGroupKey({ id: 'c1' })).toBeNull(); // single-turn
  });

  it('prefers an explicit _groupKey over the id-based rule, and still falls back correctly without it', () => {
    expect(readGroupKey({ id: 'r1', _turnIndex: 0, _groupKey: 'tc1::0' })).toBe('tc1::0');
    expect(readGroupKey({ id: 'r2', _turnIndex: 1, _groupKey: 'tc1::0' })).toBe('tc1::0');
    expect(readGroupKey({ id: 'c1', _turnIndex: 0, _groupKey: '' })).toBe('c1'); // blank ignored, falls back to id
    expect(readGroupKey({ id: 'c1', _turnIndex: 0 })).toBe('c1'); // no _groupKey, falls back to id
    expect(readGroupKey({ id: 's1', _groupKey: 'x' })).toBe('x'); // explicit key wins even without _turnIndex
    expect(readGroupKey({ id: 's1' })).toBeNull(); // neither present: single-turn
  });

  it('coerces numeric-string _turnIndex and treats 0 as present', () => {
    expect(readTurnIndex({ _turnIndex: 0 })).toBe(0);
    expect(readTurnIndex({ _turnIndex: '2' })).toBe(2);
    expect(readTurnIndex({})).toBeNull();
  });

  it('groups turn rows sharing an id into one multi-turn case, sorted by _turnIndex', () => {
    const groups = groupTestCaseRows([
      { id: 'c1', _turnIndex: 1, testCaseName: 'flow' },
      { id: 'c1', _turnIndex: 0, testCaseName: 'flow' },
      { id: 's1', testCaseName: 'solo' },
    ]);
    expect(groups).toHaveLength(2);
    const multi = groups.find((g) => g.isMulti)!;
    expect(multi.key).toBe('c1');
    expect(multi.turns.map((t) => t._turnIndex)).toEqual([0, 1]);
    expect(groups.find((g) => !g.isMulti)!.key).toBe('s1');
  });

  it('promote sets _turnIndex 0; demote strips it; reorder renumbers contiguously', () => {
    expect(promoteToMultiTurn({ id: 'c1', data: {} })._turnIndex).toBe(0);
    expect('_turnIndex' in demoteToSingle({ id: 'c1', _turnIndex: 0 })).toBe(false);
    const reordered = reorderTurns([{ _turnIndex: 0 }, { _turnIndex: 1 }, { _turnIndex: 2 }], 2, 0);
    expect(reordered.map((t) => t._turnIndex)).toEqual([0, 1, 2]);
  });

  it('a collapsed multi-turn GROUP row carries the case enabled state from its first turn', () => {
    const groupsEnabled = groupTestCaseRows([
      { id: 'c1', _turnIndex: 0, testCaseName: 'flow', enabled: true },
      { id: 'c1', _turnIndex: 1, testCaseName: 'flow', enabled: true },
    ]);
    const projectedEnabled = projectGroupsToGridRows(groupsEnabled, new Set(), false);
    const groupRowEnabled = projectedEnabled.find((row) => row.rowType === GridRowType.GROUP)!;
    expect(groupRowEnabled.enabled).toBe(true);

    const groupsDisabled = groupTestCaseRows([
      { id: 'c2', _turnIndex: 0, testCaseName: 'flow2', enabled: false },
      { id: 'c2', _turnIndex: 1, testCaseName: 'flow2', enabled: false },
    ]);
    const projectedDisabled = projectGroupsToGridRows(groupsDisabled, new Set(), false);
    const groupRowDisabled = projectedDisabled.find((row) => row.rowType === GridRowType.GROUP)!;
    expect(groupRowDisabled.enabled).toBe(false);
  });
});

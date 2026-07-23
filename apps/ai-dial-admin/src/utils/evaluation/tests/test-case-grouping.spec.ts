import { describe, expect, it } from 'vitest';
import {
  groupTestCaseRows,
  readGroupKey,
  readTurnIndex,
  promoteToMultiTurn,
  demoteToSingle,
  reorderTurns,
} from '@/src/utils/evaluation/test-case-grouping';

describe('test-case-grouping (array model)', () => {
  it('reads group key from id only when _turnIndex is present', () => {
    expect(readGroupKey({ id: 'c1', _turnIndex: 0 })).toBe('c1');
    expect(readGroupKey({ id: 'c1', _turnIndex: 2 })).toBe('c1');
    expect(readGroupKey({ id: 'c1' })).toBeNull(); // single-turn
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
});

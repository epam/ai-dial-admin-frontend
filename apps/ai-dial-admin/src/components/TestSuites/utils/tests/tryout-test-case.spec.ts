import { describe, expect, test } from 'vitest';

import { GroupedGridRow, TestCaseGroup } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { GridRowType } from '@/src/types/grid-row-type';
import { testCaseFromTryOutRow } from '../tryout-test-case';

const schema: TestCaseSchema[] = [
  { name: 'message', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true },
  { name: 'persona', type: TestCaseItemType.STRING, required: false, description: '' },
];

describe('testCaseFromTryOutRow', () => {
  test('rebuilds multiTurnData from a GROUP row turns list', () => {
    const row: GroupedGridRow = {
      id: 'case-1',
      rowType: GridRowType.GROUP,
      groupKey: 'case-1',
      turns: [
        { id: 'case-1', data: { persona: 'shared', message: 'a' }, createdAt: 1 },
        { id: 'case-1', data: { persona: 'shared', message: 'b' }, createdAt: 1 },
      ],
    };

    const result = testCaseFromTryOutRow(row, [], schema);

    expect(result).toEqual({
      id: 'case-1',
      createdAt: 1,
      data: { persona: 'shared' },
      multiTurnData: [{ message: 'a' }, { message: 'b' }],
    });
  });

  test('looks up the group for a flattened first TURN row', () => {
    const groups: TestCaseGroup[] = [
      {
        key: 'case-1',
        isMulti: true,
        turns: [
          { id: 'case-1', data: { message: 'a' }, createdAt: 2 },
          { id: 'case-1', data: { message: 'b' }, createdAt: 2 },
        ],
      },
    ];
    const row: GroupedGridRow = {
      id: 'case-1',
      rowType: GridRowType.TURN,
      groupKey: 'case-1',
      turnNumber: 1,
      isFlattened: true,
      data: { message: 'a' },
    };

    const result = testCaseFromTryOutRow(row, groups, schema);

    expect(result?.multiTurnData).toEqual([{ message: 'a' }, { message: 'b' }]);
  });

  test('returns a single-turn case without multiTurnData', () => {
    const row: GroupedGridRow = {
      id: 'case-2',
      rowType: GridRowType.SINGLE,
      groupKey: 'case-2',
      data: { message: 'once' },
      createdAt: 3,
    };

    expect(testCaseFromTryOutRow(row, [], schema)).toEqual({
      id: 'case-2',
      createdAt: 3,
      data: { message: 'once' },
    });
  });
});

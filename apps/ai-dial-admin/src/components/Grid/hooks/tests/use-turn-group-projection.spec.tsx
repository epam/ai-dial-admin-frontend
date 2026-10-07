import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { GridRowType } from '@/src/types/grid-row-type';
import { TestCaseRow } from '@/src/types/test-case-row';

import { useTurnGroupProjection } from '../use-turn-group-projection';

describe('useTurnGroupProjection', () => {
  test('re-applies expandGroup when it raced ahead of the single→multi promotion', () => {
    const single: TestCaseRow[] = [{ id: 'case-1', testCaseName: 'Case', data: { value: 'a' } }];
    const multi: TestCaseRow[] = [
      { id: 'case-1', testCaseName: 'Case', data: { value: 'a' }, _turnIndex: 0 },
      { id: 'case-1', testCaseName: 'Case', data: { value: 'b' }, _turnIndex: 1 },
    ];

    const { result, rerender } = renderHook(
      ({ rawRows }: { rawRows: TestCaseRow[] }) => useTurnGroupProjection({ rawRows }),
      { initialProps: { rawRows: single } },
    );

    // Expand before the rows are multi — the prune effect would previously drop this key.
    act(() => {
      result.current.expandGroup('case-1');
    });

    rerender({ rawRows: multi });

    expect(result.current.rowData.map((row) => row.rowType)).toEqual([
      GridRowType.GROUP,
      GridRowType.TURN,
      GridRowType.TURN,
    ]);
    expect(result.current.rowData[0].expanded).toBe(true);
  });
});

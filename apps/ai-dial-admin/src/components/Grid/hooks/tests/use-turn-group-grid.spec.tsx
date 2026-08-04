import { act, renderHook } from '@testing-library/react';
import { GridReadyEvent, RowHeightParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { ROW_HEIGHT } from '@/src/components/Grid/constants';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

import { useTurnGroupGrid } from '../use-turn-group-grid';

interface Row {
  [key: string]: unknown;
  id: string;
  testCaseName?: string;
  data: Record<string, unknown>;
  _turnIndex?: number;
}

interface DirtyCase {
  id: string;
  rows: Row[];
}

const asRows = (rows: Record<string, unknown>[]): Row[] => rows as Row[];

const collapseRows = (rows: Record<string, unknown>[]): DirtyCase[] => {
  const byId = new Map<string, Row[]>();
  rows.forEach((row) => {
    const id = String(row.id);
    byId.set(id, [...(byId.get(id) ?? []), row as Row]);
  });
  return Array.from(byId.entries()).map(([id, caseRows]) => ({ id, rows: caseRows }));
};

const row = (id: string, data: Record<string, unknown>, turnIndex?: number): Row => ({
  id,
  testCaseName: `Case ${id}`,
  data,
  ...(turnIndex === undefined ? {} : { _turnIndex: turnIndex }),
});

const schema: TestCaseSchema[] = [
  { name: 'shared', type: TestCaseItemType.STRING, required: false, description: '' },
  { name: 'perTurnField', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true },
];

const gridApiMock = () => ({
  refreshCells: vi.fn(),
  resetRowHeights: vi.fn(),
  isDestroyed: vi.fn().mockReturnValue(false),
});

const setup = () => {
  const onDeleteCase = vi.fn();
  const onDirtyChange = vi.fn();
  const { result } = renderHook(() =>
    useTurnGroupGrid<DirtyCase>({ schema, collapseRows, onDeleteCase, onDirtyChange }),
  );
  return { result, onDeleteCase, onDirtyChange };
};

describe('useTurnGroupGrid', () => {
  test('should populate rowData with a single SINGLE row for a single-turn case', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'hello' })]);
    });

    expect(result.current.rowData).toHaveLength(1);
    expect(result.current.rowData[0]).toEqual(expect.objectContaining({ id: 'case-1', rowType: GridRowType.SINGLE }));
    expect(result.current.rowData[0]).not.toHaveProperty('_turnIndex');
  });

  test('should promote a single-turn case to an expanded 2-turn group on Add turn', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'hello' })]);
    });
    act(() => {
      result.current.turnActionHandlers.onAddTurn('case-1');
    });

    const caseRows = asRows(result.current.getCaseRows('case-1'));
    expect(caseRows.map((r) => r._turnIndex)).toEqual([0, 1]);
    expect(caseRows[0].data).toEqual({ shared: 'hello' });
    expect(caseRows[1].data).toEqual({ shared: 'hello' });

    const groupRow = result.current.rowData.find((r) => r.id === 'case-1' && r.rowType === GridRowType.GROUP);
    expect(groupRow?.expanded).toBe(true);
    expect(result.current.rowData.filter((r) => r.rowType === GridRowType.TURN)).toHaveLength(2);
  });

  test('should append a new turn with the next _turnIndex to an already multi-turn case', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }, 0), row('case-1', { shared: 'b' }, 1)]);
    });
    act(() => {
      result.current.turnActionHandlers.onAddTurn('case-1');
    });

    expect(asRows(result.current.getCaseRows('case-1')).map((r) => r._turnIndex)).toEqual([0, 1, 2]);
  });

  test('should seed a new turn with the shared field values and leave the per-turn ones empty', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'hello', perTurnField: 'x' })]);
    });
    act(() => {
      result.current.turnActionHandlers.onAddTurn('case-1');
    });

    expect(asRows(result.current.getCaseRows('case-1'))[1].data).toEqual({ shared: 'hello' });
  });

  test('regression: should keep the shared field values when the original first turn is deleted', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'hello', perTurnField: 'x' })]);
    });
    act(() => {
      result.current.turnActionHandlers.onAddTurn('case-1');
    });

    const originalFirstTurn = asRows(result.current.getCaseRows('case-1'))[0];
    act(() => {
      result.current.turnActionHandlers.onDeleteTurn({
        ...originalFirstTurn,
        rowType: GridRowType.TURN,
        groupKey: 'case-1',
      } as GroupedGridRow);
    });

    const remaining = asRows(result.current.getCaseRows('case-1'));
    expect(remaining).toHaveLength(1);
    expect(remaining[0].data.shared).toBe('hello');
  });

  test('should renumber the remaining turns contiguously after deleting a middle turn', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a' }, 0),
        row('case-1', { shared: 'b' }, 1),
        row('case-1', { shared: 'c' }, 2),
      ]);
    });

    const turnToDelete = asRows(result.current.getCaseRows('case-1'))[1];
    act(() => {
      result.current.turnActionHandlers.onDeleteTurn({
        ...turnToDelete,
        rowType: GridRowType.TURN,
        groupKey: 'case-1',
      } as GroupedGridRow);
    });

    const remaining = asRows(result.current.getCaseRows('case-1'));
    expect(remaining.map((r) => r._turnIndex)).toEqual([0, 1]);
    expect(remaining.map((r) => r.data)).toEqual([{ shared: 'a' }, { shared: 'c' }]);
  });

  test('should demote a two-turn case back to a SINGLE row with no _turnIndex when deleted down to one turn', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }, 0), row('case-1', { shared: 'b' }, 1)]);
    });

    const turnToDelete = asRows(result.current.getCaseRows('case-1'))[1];
    act(() => {
      result.current.turnActionHandlers.onDeleteTurn({
        ...turnToDelete,
        rowType: GridRowType.TURN,
        groupKey: 'case-1',
      } as GroupedGridRow);
    });

    const remaining = asRows(result.current.getCaseRows('case-1'));
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).not.toHaveProperty('_turnIndex');

    const singleRow = result.current.rowData.find((r) => r.id === 'case-1');
    expect(singleRow?.rowType).toBe(GridRowType.SINGLE);
  });

  test('should reorder and renumber turns on move up / move down', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a' }, 0),
        row('case-1', { shared: 'b' }, 1),
        row('case-1', { shared: 'c' }, 2),
      ]);
    });

    const lastTurn = asRows(result.current.getCaseRows('case-1'))[2];
    act(() => {
      result.current.turnActionHandlers.onMoveTurnUp({
        ...lastTurn,
        rowType: GridRowType.TURN,
        groupKey: 'case-1',
        turnNumber: 3,
      } as GroupedGridRow);
    });

    expect(asRows(result.current.getCaseRows('case-1')).map((r) => r.data)).toEqual([
      { shared: 'a' },
      { shared: 'c' },
      { shared: 'b' },
    ]);
  });

  test('should be a no-op when moving the first turn up (boundary)', () => {
    const { result, onDirtyChange } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }, 0), row('case-1', { shared: 'b' }, 1)]);
    });

    const firstTurn = asRows(result.current.getCaseRows('case-1'))[0];
    act(() => {
      result.current.turnActionHandlers.onMoveTurnUp({
        ...firstTurn,
        rowType: GridRowType.TURN,
        groupKey: 'case-1',
        turnNumber: 1,
      } as GroupedGridRow);
    });

    expect(asRows(result.current.getCaseRows('case-1')).map((r) => r.data)).toEqual([{ shared: 'a' }, { shared: 'b' }]);
    expect(onDirtyChange).not.toHaveBeenCalled();
    expect(result.current.getDirtyRows()).toEqual([]);
  });

  test('should be a no-op when moving the last turn down (boundary)', () => {
    const { result, onDirtyChange } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }, 0), row('case-1', { shared: 'b' }, 1)]);
    });

    const lastTurn = asRows(result.current.getCaseRows('case-1'))[1];
    act(() => {
      result.current.turnActionHandlers.onMoveTurnDown({
        ...lastTurn,
        rowType: GridRowType.TURN,
        groupKey: 'case-1',
        turnNumber: 2,
      } as GroupedGridRow);
    });

    expect(asRows(result.current.getCaseRows('case-1')).map((r) => r.data)).toEqual([{ shared: 'a' }, { shared: 'b' }]);
    expect(onDirtyChange).not.toHaveBeenCalled();
    expect(result.current.getDirtyRows()).toEqual([]);
  });

  test('should track dirty rows per case id, firing onDirtyChange, and clear them via clearDirty', () => {
    const { result, onDirtyChange } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }), row('case-2', { shared: 'z' })]);
    });
    act(() => {
      result.current.onCellChange({ id: 'case-1' }, 'shared', 'edited');
    });

    expect(onDirtyChange).toHaveBeenCalledWith(true);
    expect(result.current.getDirtyRows().map((c) => c.id)).toEqual(['case-1']);

    act(() => {
      result.current.clearDirty();
    });

    expect(onDirtyChange).toHaveBeenCalledWith(false);
    expect(result.current.getDirtyRows()).toEqual([]);
  });

  test('should fan a shared-field edit out to every turn row of the case', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a', perTurnField: 'x' }, 0),
        row('case-1', { shared: 'a', perTurnField: 'y' }, 1),
      ]);
    });
    act(() => {
      result.current.onCellChange({ id: 'case-1' }, 'shared', 'updated');
    });

    const rows = asRows(result.current.getCaseRows('case-1'));
    expect(rows.map((r) => r.data.shared)).toEqual(['updated', 'updated']);
  });

  test('should rename every turn of the case when the name is edited on the group row', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }, 0), row('case-1', { shared: 'a' }, 1)]);
    });

    const groupRow = result.current.rowData.find((r) => r.rowType === GridRowType.GROUP) as GroupedGridRow;
    act(() => {
      result.current.onCellChange(groupRow, 'testCaseName', 'Renamed');
    });

    expect(asRows(result.current.getCaseRows('case-1')).map((r) => r.testCaseName)).toEqual(['Renamed', 'Renamed']);
    expect(result.current.getDirtyRows().map((c) => c.id)).toEqual(['case-1']);
  });

  test('should keep a renamed group out of the row data map and only in the case rows', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }, 0), row('case-1', { shared: 'a' }, 1)]);
    });

    const groupRow = result.current.rowData.find((r) => r.rowType === GridRowType.GROUP) as GroupedGridRow;
    act(() => {
      result.current.onCellChange(groupRow, 'testCaseName', 'Renamed');
    });

    expect(asRows(result.current.getCaseRows('case-1')).map((r) => r.data)).toEqual([{ shared: 'a' }, { shared: 'a' }]);
  });

  test('should touch only the row with the matching _turnIndex on a per-turn field edit', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a', perTurnField: 'x' }, 0),
        row('case-1', { shared: 'a', perTurnField: 'y' }, 1),
      ]);
    });
    act(() => {
      result.current.onCellChange({ id: 'case-1', _turnIndex: 1 }, 'perTurnField', 'updated');
    });

    const rows = asRows(result.current.getCaseRows('case-1'));
    expect(rows[0].data.perTurnField).toBe('x');
    expect(rows[1].data.perTurnField).toBe('updated');
  });

  test('should keep an edit made while the group is collapsed present in getDirtyRows', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a', perTurnField: 'x' }, 0),
        row('case-1', { shared: 'a', perTurnField: 'y' }, 1),
      ]);
    });

    expect(result.current.rowData.filter((r) => r.rowType === GridRowType.TURN)).toHaveLength(0);

    act(() => {
      result.current.onCellChange({ id: 'case-1', _turnIndex: 1 }, 'perTurnField', 'updated');
    });

    const dirtyCase = result.current.getDirtyRows().find((c) => c.id === 'case-1');
    expect(dirtyCase?.rows.some((r) => r._turnIndex === 1 && r.data.perTurnField === 'updated')).toBe(true);
  });

  test('an edit does not appear in the current rowData snapshot, only after a later projection refresh', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a', perTurnField: 'x' }, 0),
        row('case-1', { shared: 'a', perTurnField: 'y' }, 1),
      ]);
    });
    act(() => {
      result.current.expandGroup('case-1');
    });
    const rowDataBefore = result.current.rowData;

    act(() => {
      result.current.onCellChange({ id: 'case-1', _turnIndex: 1 }, 'perTurnField', 'updated');
    });

    expect(result.current.rowData).toBe(rowDataBefore);
    const staleTurnRow = result.current.rowData.find((r) => r.rowType === GridRowType.TURN && r.turnNumber === 2);
    expect((staleTurnRow?.data as Record<string, unknown>).perTurnField).toBe('y');

    act(() => {
      result.current.onToggleExpand('case-1');
    });
    act(() => {
      result.current.onToggleExpand('case-1');
    });

    const refreshedTurnRow = result.current.rowData.find((r) => r.rowType === GridRowType.TURN && r.turnNumber === 2);
    expect((refreshedTurnRow?.data as Record<string, unknown>).perTurnField).toBe('updated');
  });

  test('should preserve a dirty case turns across a reload without duplicating them', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a' }, 0),
        row('case-1', { shared: 'b' }, 1),
        row('case-2', { shared: 'z' }),
      ]);
    });
    act(() => {
      result.current.onCellChange({ id: 'case-1', _turnIndex: 0 }, 'shared', 'edited');
    });

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'stale-0' }, 0),
        row('case-1', { shared: 'stale-1' }, 1),
        row('case-2', { shared: 'new-server-value' }),
      ]);
    });

    const case1Rows = asRows(result.current.getCaseRows('case-1'));
    expect(case1Rows).toHaveLength(2);
    expect(case1Rows[0].data.shared).toBe('edited');

    const case2Rows = asRows(result.current.getCaseRows('case-2'));
    expect(case2Rows[0].data.shared).toBe('new-server-value');
  });

  test('should drop out-of-schema keys via pruneToSchema, but only from dirty rows', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([
        row('case-1', { shared: 'a', stale: 'x' }),
        row('case-2', { shared: 'b', stale: 'y' }),
      ]);
    });
    act(() => {
      result.current.onCellChange({ id: 'case-1' }, 'shared', 'edited');
    });
    act(() => {
      result.current.pruneToSchema(new Set(['shared']));
    });

    expect(asRows(result.current.getCaseRows('case-1'))[0].data).toEqual({ shared: 'edited' });
    expect(asRows(result.current.getCaseRows('case-2'))[0].data).toEqual({ shared: 'b', stale: 'y' });
  });

  test('regression: a purely single-turn workload behaves exactly as before', () => {
    const { result } = setup();

    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' }), row('case-2', { shared: 'b' })]);
    });

    expect(result.current.rowData).toHaveLength(2);
    result.current.rowData.forEach((r) => {
      expect(r.rowType).toBe(GridRowType.SINGLE);
      expect(r).not.toHaveProperty('_turnIndex');
      expect(r).not.toHaveProperty('multiTurnData');
    });
    expect(result.current.getDirtyRows()).toEqual([]);
  });

  test('should reset row heights on every projection change so an expanded group loses its stacked height', () => {
    const { result } = setup();
    const api = gridApiMock();

    act(() => {
      result.current.onGridReady({ api } as unknown as GridReadyEvent);
    });
    act(() => {
      result.current.setServerRows([row('case-1', { perTurnField: 'a' }, 0), row('case-1', { perTurnField: 'b' }, 1)]);
    });

    const collapsed = result.current.rowData.find((r) => r.rowType === GridRowType.GROUP) as GroupedGridRow;
    expect(result.current.turnGridOptions.getRowHeight({ data: collapsed } as RowHeightParams)).toBeGreaterThan(
      ROW_HEIGHT,
    );

    api.resetRowHeights.mockClear();
    act(() => {
      result.current.onToggleExpand('case-1');
    });

    expect(api.resetRowHeights).toHaveBeenCalled();
    const expanded = result.current.rowData.find((r) => r.rowType === GridRowType.GROUP) as GroupedGridRow;
    expect(result.current.turnGridOptions.getRowHeight({ data: expanded } as RowHeightParams)).toBe(ROW_HEIGHT);
  });

  test('should not touch a destroyed grid api', () => {
    const { result } = setup();
    const api = gridApiMock();
    api.isDestroyed.mockReturnValue(true);

    act(() => {
      result.current.onGridReady({ api } as unknown as GridReadyEvent);
    });
    act(() => {
      result.current.setServerRows([row('case-1', { shared: 'a' })]);
    });

    expect(api.refreshCells).not.toHaveBeenCalled();
    expect(api.resetRowHeights).not.toHaveBeenCalled();
  });
});

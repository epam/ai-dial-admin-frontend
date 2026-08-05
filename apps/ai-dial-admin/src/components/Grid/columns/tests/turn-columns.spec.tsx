import { GridApi, ICellRendererParams, IRowNode, ValueGetterParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import EmptyCellRenderer from '@/src/components/Grid/CellRenderers/EmptyCellRenderer';
import FileSelectCellRenderer from '@/src/components/Grid/CellRenderers/FileSelectCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseItemType } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';

import {
  getGroupedIdColumn,
  getGroupedNameColumn,
  getGroupedSchemaColumn,
  getTurnActionsColumn,
  SchemaColumnContext,
  TurnActionHandlers,
} from '../turn-columns';
import { GridRowType } from '@/src/types/grid-row-type';

const rendererParams = (data: Partial<GroupedGridRow>) => ({ data }) as ICellRendererParams<GroupedGridRow>;

const callValueGetter = (column: { valueGetter?: unknown }, data: Partial<GroupedGridRow>): unknown =>
  (column.valueGetter as (params: ValueGetterParams<GroupedGridRow>) => unknown)({
    data,
  } as ValueGetterParams<GroupedGridRow>);

describe('getGroupedIdColumn', () => {
  test('should return the id for a GROUP row', () => {
    const column = getGroupedIdColumn();

    expect(callValueGetter(column, { id: 'case-1', rowType: GridRowType.GROUP })).toBe('case-1');
  });

  test('should return the id for a SINGLE row', () => {
    const column = getGroupedIdColumn();

    expect(callValueGetter(column, { id: 'case-1', rowType: GridRowType.SINGLE })).toBe('case-1');
  });

  test('should return the id for a TURN row so an id filter can match a turn', () => {
    const column = getGroupedIdColumn();

    expect(callValueGetter(column, { id: 'case-1', rowType: GridRowType.TURN })).toBe('case-1');
  });
});

describe('getGroupedNameColumn', () => {
  test('should select an editable TestCaseNameCellRenderer on a GROUP row', () => {
    const onCell = vi.fn();
    const column = getGroupedNameColumn(onCell, true);

    const selected = column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.GROUP }));

    expect(selected?.component).toBe(TestCaseNameCellRenderer);
    expect(selected?.params).toEqual(expect.objectContaining({ isReadonly: true }));

    selected?.params?.onChange('Renamed', { id: 'case-1' });
    expect(onCell).toHaveBeenCalledWith({ id: 'case-1' }, 'testCaseName', 'Renamed');
  });

  test('should select TestCaseNameCellRenderer on a TURN row, with the name editor wired for the flattened case', () => {
    const onCell = vi.fn();
    const column = getGroupedNameColumn(onCell);

    const selected = column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.TURN }));

    expect(selected?.component).toBe(TestCaseNameCellRenderer);

    selected?.params?.onChange('Renamed', { id: 'case-1', _turnIndex: 1 });
    expect(onCell).toHaveBeenCalledWith({ id: 'case-1', _turnIndex: 1 }, 'testCaseName', 'Renamed');
  });

  test('should select EditableCellRenderer on a SINGLE row and thread isReadOnly through', () => {
    const column = getGroupedNameColumn(vi.fn(), true);

    const selected = column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.SINGLE }));

    expect(selected?.component).toBe(EditableCellRenderer);
    expect(selected?.params).toEqual(expect.objectContaining({ isReadonly: true }));
  });

  test('should stay editable for a row with no rowType at all', () => {
    const column = getGroupedNameColumn(vi.fn());

    const selected = column.cellRendererSelector?.(rendererParams({}));

    expect(selected?.component).toBe(EditableCellRenderer);
  });

  test('should call onCell with the testCaseName field on change', () => {
    const onCell = vi.fn();
    const column = getGroupedNameColumn(onCell);

    const selected = column.cellRendererSelector?.(rendererParams({}));
    selected?.params?.onChange('New name', { id: 'case-1' });

    expect(onCell).toHaveBeenCalledWith({ id: 'case-1' }, 'testCaseName', 'New name');
  });
});

describe('getGroupedSchemaColumn', () => {
  const ctx: SchemaColumnContext = { entityId: 'entity-1', view: ApplicationRoute.Applications };

  test('should select StackedTurnsCellRenderer for a per-turn field on a GROUP row', () => {
    const column = getGroupedSchemaColumn(
      { name: 'field', type: TestCaseItemType.STRING, perTurn: true },
      vi.fn(),
      ctx,
    );

    expect(column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.GROUP }))?.component).toBe(
      StackedTurnsCellRenderer,
    );
  });

  test('should select EmptyCellRenderer for a shared field on a TURN row', () => {
    const column = getGroupedSchemaColumn(
      { name: 'field', type: TestCaseItemType.STRING, perTurn: false },
      vi.fn(),
      ctx,
    );

    expect(column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.TURN }))?.component).toBe(
      EmptyCellRenderer,
    );
  });

  test('should NOT select StackedTurnsCellRenderer for a shared field on a GROUP row', () => {
    const column = getGroupedSchemaColumn(
      { name: 'field', type: TestCaseItemType.STRING, perTurn: false },
      vi.fn(),
      ctx,
    );

    expect(column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.GROUP }))?.component).not.toBe(
      StackedTurnsCellRenderer,
    );
  });

  test('should NOT select EmptyCellRenderer for a per-turn field on a TURN row', () => {
    const column = getGroupedSchemaColumn(
      { name: 'field', type: TestCaseItemType.STRING, perTurn: true },
      vi.fn(),
      ctx,
    );

    expect(column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.TURN }))?.component).not.toBe(
      EmptyCellRenderer,
    );
  });

  test.each([
    [TestCaseItemType.STRING, EditableCellRenderer],
    [TestCaseItemType.NUMBER, EditableCellRenderer],
    [TestCaseItemType.INTEGER, EditableCellRenderer],
    [TestCaseItemType.BOOLEAN, SelectCellRenderer],
    [TestCaseItemType.OBJECT, JsonEditorCellRenderer],
    [TestCaseItemType.ARRAY, JsonEditorCellRenderer],
    [TestCaseItemType.FILE, FileSelectCellRenderer],
  ])('should choose the type-driven renderer for %s on a SINGLE row', (type, expected) => {
    const column = getGroupedSchemaColumn({ name: 'field', type }, vi.fn(), ctx);

    expect(column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.SINGLE }))?.component).toBe(expected);
  });

  test('should stay editable via the type-driven renderer for a row with no rowType at all', () => {
    const column = getGroupedSchemaColumn(
      { name: 'field', type: TestCaseItemType.STRING, perTurn: true },
      vi.fn(),
      ctx,
    );

    expect(column.cellRendererSelector?.(rendererParams({}))?.component).toBe(EditableCellRenderer);
  });

  test('should still round a non-integer value in the number branch', () => {
    const onCell = vi.fn();
    const column = getGroupedSchemaColumn({ name: 'age', type: TestCaseItemType.INTEGER }, onCell, ctx);

    const selected = column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.SINGLE }));
    selected?.params?.onChange('3.7', { id: 'case-1' });

    expect(onCell).toHaveBeenCalledWith({ id: 'case-1' }, 'age', 4);
  });

  test('should pass an already-integer value through without special rounding handling', () => {
    const onCell = vi.fn();
    const column = getGroupedSchemaColumn({ name: 'age', type: TestCaseItemType.INTEGER }, onCell, ctx);

    const selected = column.cellRendererSelector?.(rendererParams({ rowType: GridRowType.SINGLE }));
    selected?.params?.onChange('5', { id: 'case-1' });

    expect(onCell).toHaveBeenCalledWith({ id: 'case-1' }, 'age', 5);
  });
});

describe('getTurnActionsColumn', () => {
  const handlers: TurnActionHandlers = {
    onAddTurn: vi.fn(),
    onDeleteCase: vi.fn(),
    onDeleteTurn: vi.fn(),
    onMoveTurnUp: vi.fn(),
    onMoveTurnDown: vi.fn(),
  };

  const findItem = (id: string) => {
    const column = getTurnActionsColumn(handlers);
    const items = column.cellRendererParams?.items as {
      id: string;
      hidden?: (api: GridApi, node: IRowNode) => boolean;
      onClick: (row?: GroupedGridRow) => void;
    }[];
    return items.find((item) => item.id === id)!;
  };

  const nodeFor = (rowType?: GridRowType) => ({ data: rowType ? { rowType } : undefined }) as IRowNode;

  const turnNodeFor = (turnNumber: number, turnCount: number) =>
    ({ data: { rowType: GridRowType.TURN, turnNumber, turnCount } }) as IRowNode;

  test('should hide Add turn on a TURN row and show it elsewhere', () => {
    const item = findItem(ActionMenuOperationI18nKey.Add_turn);

    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.TURN))).toBe(true);
    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.GROUP))).toBe(false);
    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.SINGLE))).toBe(false);
  });

  test('should hide Delete test case on a TURN row and show it elsewhere', () => {
    const item = findItem(ActionMenuOperationI18nKey.Delete_case);

    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.TURN))).toBe(true);
    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.GROUP))).toBe(false);
  });

  test.each([
    ActionMenuOperationI18nKey.Move_turn_up,
    ActionMenuOperationI18nKey.Move_turn_down,
    ActionMenuOperationI18nKey.Delete_turn,
  ])('should hide %s on non-TURN rows and show it on a TURN row', (id) => {
    const item = findItem(id);

    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.GROUP))).toBe(true);
    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.SINGLE))).toBe(true);
    expect(item.hidden?.({} as GridApi, nodeFor(GridRowType.TURN))).toBe(false);
  });

  test('should hide Move turn up on the first turn and show it on the others', () => {
    const item = findItem(ActionMenuOperationI18nKey.Move_turn_up);

    expect(item.hidden?.({} as GridApi, turnNodeFor(1, 3))).toBe(true);
    expect(item.hidden?.({} as GridApi, turnNodeFor(2, 3))).toBe(false);
    expect(item.hidden?.({} as GridApi, turnNodeFor(3, 3))).toBe(false);
  });

  test('should hide Move turn down on the last turn and show it on the others', () => {
    const item = findItem(ActionMenuOperationI18nKey.Move_turn_down);

    expect(item.hidden?.({} as GridApi, turnNodeFor(3, 3))).toBe(true);
    expect(item.hidden?.({} as GridApi, turnNodeFor(1, 3))).toBe(false);
    expect(item.hidden?.({} as GridApi, turnNodeFor(2, 3))).toBe(false);
  });

  test('should offer neither move direction on the only turn of a case', () => {
    expect(findItem(ActionMenuOperationI18nKey.Move_turn_up).hidden?.({} as GridApi, turnNodeFor(1, 1))).toBe(true);
    expect(findItem(ActionMenuOperationI18nKey.Move_turn_down).hidden?.({} as GridApi, turnNodeFor(1, 1))).toBe(true);
  });

  test('should keep Delete turn available on a boundary turn', () => {
    const item = findItem(ActionMenuOperationI18nKey.Delete_turn);

    expect(item.hidden?.({} as GridApi, turnNodeFor(1, 2))).toBe(false);
    expect(item.hidden?.({} as GridApi, turnNodeFor(2, 2))).toBe(false);
  });

  test('should call onAddTurn with the group key, not the row', () => {
    const item = findItem(ActionMenuOperationI18nKey.Add_turn);
    const row = { id: 'case-1', rowType: GridRowType.GROUP, groupKey: 'case-1' } as GroupedGridRow;

    item.onClick(row);

    expect(handlers.onAddTurn).toHaveBeenCalledWith('case-1');
  });

  test.each([
    [ActionMenuOperationI18nKey.Delete_case, 'onDeleteCase'],
    [ActionMenuOperationI18nKey.Move_turn_up, 'onMoveTurnUp'],
    [ActionMenuOperationI18nKey.Move_turn_down, 'onMoveTurnDown'],
    [ActionMenuOperationI18nKey.Delete_turn, 'onDeleteTurn'],
  ] as const)('should call %s with the row itself', (id, handlerName) => {
    const item = findItem(id);
    const row = { id: 'case-1', rowType: GridRowType.TURN, groupKey: 'case-1', turnNumber: 2 } as GroupedGridRow;

    item.onClick(row);

    expect(handlers[handlerName]).toHaveBeenCalledWith(row);
  });
});

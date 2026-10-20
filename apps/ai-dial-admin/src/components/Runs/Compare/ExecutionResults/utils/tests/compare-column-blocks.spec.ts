import { ColDef, ColGroupDef, ColumnState, GridApi } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { EXECUTION_GROUP_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import {
  applyCompareColumnMove,
  collectCompareColumnBlocks,
  orderWithCompareBlocksIntact,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/compare-column-blocks';

const metric = (name: string): ColGroupDef => ({
  headerName: name,
  children: [{ colId: `${name}_1` }, { colId: `cmp_${name}_1` }, { colId: `delta_${name}_1` }],
});

const columnDefs: (ColDef | ColGroupDef)[] = [
  { headerName: '', children: [{ colId: 'status' }, { colId: 'cmp_status' }] },
  { colId: 'testCaseName' },
  {
    headerName: EXECUTION_GROUP_HEADER,
    children: [{ colId: 'http' }, { colId: 'cmp_http' }],
  },
  {
    headerName: 'Set Comparison',
    children: [metric('recall'), metric('precision')],
  },
];

describe('compare column blocks', () => {
  test('collects status and each metric, and leaves execution fields free', () => {
    expect(collectCompareColumnBlocks(columnDefs)).toEqual([
      ['status', 'cmp_status'],
      ['recall_1', 'cmp_recall_1', 'delta_recall_1'],
      ['precision_1', 'cmp_precision_1', 'delta_precision_1'],
    ]);
  });

  test('moves a metric block with its delta and keeps run, compare, delta order', () => {
    const dropped = [
      'status',
      'cmp_status',
      'testCaseName',
      'delta_recall_1',
      'precision_1',
      'cmp_precision_1',
      'delta_precision_1',
      'recall_1',
      'cmp_recall_1',
    ];

    expect(
      orderWithCompareBlocksIntact(dropped, collectCompareColumnBlocks(columnDefs), new Set(['delta_recall_1'])),
    ).toEqual([
      'status',
      'cmp_status',
      'testCaseName',
      'recall_1',
      'cmp_recall_1',
      'delta_recall_1',
      'precision_1',
      'cmp_precision_1',
      'delta_precision_1',
    ]);
  });

  test('leaves a block that is already contiguous and ordered', () => {
    const order = ['recall_1', 'cmp_recall_1', 'delta_recall_1', 'testCaseName', 'status', 'cmp_status'];

    expect(orderWithCompareBlocksIntact(order, collectCompareColumnBlocks(columnDefs), new Set(['recall_1']))).toEqual(
      order,
    );
  });

  test('applyCompareColumnMove corrects a split metric block and returns the live state', () => {
    const splitState: ColumnState[] = [
      { colId: 'status' },
      { colId: 'cmp_status' },
      { colId: 'testCaseName' },
      { colId: 'delta_recall_1' },
      { colId: 'precision_1' },
      { colId: 'cmp_precision_1' },
      { colId: 'delta_precision_1' },
      { colId: 'recall_1' },
      { colId: 'cmp_recall_1' },
    ];
    let liveState = splitState;
    const api = {
      getColumnState: () => liveState,
      applyColumnState: vi.fn(({ state }: { state: ColumnState[] }) => {
        liveState = state;
      }),
    } as unknown as Pick<GridApi, 'getColumnState' | 'applyColumnState'>;

    const next = applyCompareColumnMove(api, columnDefs, new Set(['delta_recall_1']));

    expect(api.applyColumnState).toHaveBeenCalled();
    expect(next.map((column) => column.colId)).toEqual([
      'status',
      'cmp_status',
      'testCaseName',
      'recall_1',
      'cmp_recall_1',
      'delta_recall_1',
      'precision_1',
      'cmp_precision_1',
      'delta_precision_1',
    ]);
  });

  test('applyCompareColumnMove skips applyColumnState when blocks are already intact', () => {
    const intact: ColumnState[] = [
      { colId: 'status' },
      { colId: 'cmp_status' },
      { colId: 'testCaseName' },
      { colId: 'recall_1' },
      { colId: 'cmp_recall_1' },
      { colId: 'delta_recall_1' },
    ];
    const api = {
      getColumnState: () => intact,
      applyColumnState: vi.fn(),
    } as unknown as Pick<GridApi, 'getColumnState' | 'applyColumnState'>;

    const next = applyCompareColumnMove(api, columnDefs, new Set(['recall_1']));

    expect(api.applyColumnState).not.toHaveBeenCalled();
    expect(next).toEqual(intact);
  });
});

import { ColDef, ColGroupDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { EXECUTION_GROUP_HEADER } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import {
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
});

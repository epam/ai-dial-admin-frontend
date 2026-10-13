import { ColumnState } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { swapComparePairColumnState } from '@/src/components/Runs/Compare/ExecutionResults/utils/compare-column-state';

const colIds = (state: ColumnState[]) => state.map((column) => column.colId);

describe('Runs Compare :: swapComparePairColumnState', () => {
  test('swaps each primary/compared pair and leaves other columns in place', () => {
    const state: ColumnState[] = [
      { colId: 'status' },
      { colId: 'cmp_status' },
      { colId: 'testCaseName' },
      { colId: 'Accuracy_precision' },
      { colId: 'cmp_Accuracy_precision' },
      { colId: 'delta_Accuracy_precision' },
    ];

    expect(colIds(swapComparePairColumnState(state))).toEqual([
      'cmp_status',
      'status',
      'testCaseName',
      'cmp_Accuracy_precision',
      'Accuracy_precision',
      'delta_Accuracy_precision',
    ]);
  });

  test('carries per-column state along with the column', () => {
    const state: ColumnState[] = [
      { colId: 'http', hide: true, width: 80 },
      { colId: 'cmp_http', hide: false, width: 120 },
    ];

    expect(swapComparePairColumnState(state)).toEqual([
      { colId: 'cmp_http', hide: false, width: 120 },
      { colId: 'http', hide: true, width: 80 },
    ]);
  });

  test('swapping twice restores the original order', () => {
    const state: ColumnState[] = [{ colId: 'duration' }, { colId: 'testCaseName' }, { colId: 'cmp_duration' }];

    expect(swapComparePairColumnState(swapComparePairColumnState(state))).toEqual(state);
  });

  test('does not mutate the input and handles an empty state', () => {
    const state: ColumnState[] = [{ colId: 'status' }, { colId: 'cmp_status' }];
    swapComparePairColumnState(state);

    expect(colIds(state)).toEqual(['status', 'cmp_status']);
    expect(swapComparePairColumnState([])).toEqual([]);
  });
});

import { ColDef, ColGroupDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { disableGroupedRowSortingAndFiltering } from '@/src/components/Runs/grid-column-layout';

const enabledColumn: ColDef = {
  field: 'score',
  sortable: true,
  filter: 'agNumberColumnFilter',
  floatingFilter: true,
};

const disabledColumn: ColDef = {
  field: 'score',
  sortable: false,
  filter: false,
  floatingFilter: false,
};

describe('disableGroupedRowSortingAndFiltering', () => {
  test('disables sorting and filtering on standalone and nested columns without mutating inputs', () => {
    const columns: (ColDef | ColGroupDef)[] = [
      { ...enabledColumn },
      { headerName: 'Metrics', children: [{ headerName: 'Accuracy', children: [{ ...enabledColumn }] }] },
    ];

    expect(disableGroupedRowSortingAndFiltering(columns)).toEqual([
      disabledColumn,
      { headerName: 'Metrics', children: [{ headerName: 'Accuracy', children: [disabledColumn] }] },
    ]);
    expect(columns).toEqual([
      enabledColumn,
      { headerName: 'Metrics', children: [{ headerName: 'Accuracy', children: [enabledColumn] }] },
    ]);
  });

  test('preserves empty groups and accepts an empty column list', () => {
    expect(disableGroupedRowSortingAndFiltering([{ headerName: 'Metrics', children: [] }])).toEqual([
      { headerName: 'Metrics', children: [] },
    ]);
    expect(disableGroupedRowSortingAndFiltering([])).toEqual([]);
  });
});

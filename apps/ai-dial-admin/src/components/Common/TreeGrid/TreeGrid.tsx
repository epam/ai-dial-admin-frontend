'use client';

import { ColDef, GetRowIdParams, GridOptions } from 'ag-grid-community';
import { useMemo } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import ExpanderCell from './ExpanderCell';
import { TreeRow } from './types';
import { useTreeRows } from './use-tree-rows';

interface TreeGridProps<T extends object> {
  rows: TreeRow<T>[];
  columnDefs: ColDef[];
  expanderColumnField: string;
  emptyDataTitle?: string;
}

const TreeGrid = <T extends object>({ rows, columnDefs, expanderColumnField, emptyDataTitle }: TreeGridProps<T>) => {
  const { flatRows, onToggleExpand, onGridReady } = useTreeRows<T>(rows);

  const augmentedColumnDefs = useMemo(
    () =>
      columnDefs.map((col) => {
        const sanitized: ColDef = { ...col, sort: null, sortable: false, filter: false };
        return col.field === expanderColumnField
          ? { ...sanitized, cellRenderer: ExpanderCell, cellRendererParams: { onToggleExpand } }
          : sanitized;
      }),
    [columnDefs, expanderColumnField, onToggleExpand],
  );

  const additionalGridOptions = useMemo<GridOptions<TreeRow<T>>>(
    () => ({ getRowId: (params: GetRowIdParams<TreeRow<T>>) => params.data.id }),
    [],
  );

  return (
    <GridView<TreeRow<T>>
      rowData={flatRows}
      columnDefs={augmentedColumnDefs}
      additionalGridOptions={additionalGridOptions}
      onGridReady={onGridReady}
      getIsEmptyData={() => rows.length === 0}
      emptyDataProps={emptyDataTitle ? { title: emptyDataTitle } : undefined}
    />
  );
};

export default TreeGrid;

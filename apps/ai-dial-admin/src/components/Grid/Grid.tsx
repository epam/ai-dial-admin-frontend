'use client';

import {
  AgGridEvent,
  CellApiModule,
  CellStyleModule,
  ClientSideRowModelModule,
  ColDef,
  colorSchemeDark,
  ColumnApiModule,
  ColumnAutoSizeModule,
  GridApi,
  GridOptions,
  GridReadyEvent,
  GridSizeChangedEvent,
  GridStateModule,
  ITextFilterParams,
  ITooltipParams,
  ModuleRegistry,
  NumberFilterModule,
  RenderApiModule,
  RowApiModule,
  RowDragModule,
  RowSelectionModule,
  RowStyleModule,
  TextFilterModule,
  InfiniteRowModelModule,
  themeBalham,
  TooltipModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useState } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { baseColumnComparator } from './comparators/base-column-comparator';
import { getColumnsStateFromStorage, GridModel, saveColumnsStateToStorage } from './grid-columns';
import { getRowHeight } from './grid-rows';
import FloatingFilter from './FloatingFilter/FloatingFilterComponent';

interface Props<T> {
  columnDefs?: ColDef[];
  rowData?: T[];
  additionalGridOptions?: GridOptions;
  view?: ApplicationRoute;
  onGridReady?: (gridApi: GridApi) => void;
}

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  CellStyleModule,
  TextFilterModule,
  NumberFilterModule,
  TooltipModule,
  RowSelectionModule,
  GridStateModule,
  RowApiModule,
  RenderApiModule,
  RowDragModule,
  ColumnApiModule,
  CellApiModule,
  InfiniteRowModelModule,
  RowStyleModule,
]);

const GRID_THEME_COLORS = {
  accentColor: 'var(--controls-bg-accent, #5C8DEA)',
  backgroundColor: 'var(--bg-layer-2, #141A23)',
  borderColor: 'var(--bg-layer-4, #333942)',
  borderRadius: 3,
  browserColorScheme: 'dark',
  chromeBackgroundColor: 'var(--bg-layer-1, #090D13)',
  foregroundColor: 'var(--text-primary, #F3F4F6)',
  headerFontSize: 14,
  headerFontWeight: 600,
  headerTextColor: 'var(--text-secondary, #7F8792)',
  oddRowBackgroundColor: 'var(--bg-layer-3, #222932)',
  spacing: 4,
  wrapperBorderRadius: 3,
  fontSize: 14,
  fontFamily: {
    googleFont: 'var(--theme-font, var(--font-inter))',
  },
};

const Grid = <T extends object>({
  columnDefs,
  rowData,
  additionalGridOptions,
  view,
  onGridReady: gridReadyCb,
}: Props<T>) => {
  const [rowHeight, setRowHeight] = useState(getRowHeight());
  const [gridApi, setGridApi] = useState<GridApi>();

  const onStateChanged = useCallback(
    (e: AgGridEvent) => {
      if (view) {
        const columns = e.api.getColumnState();
        const filters = e.api.getFilterModel();
        const model: GridModel = {
          columns,
          filters,
        };
        saveColumnsStateToStorage(view, model);
      }
    },
    [view],
  );

  const onGridSizeChanged = useCallback(
    (e: GridSizeChangedEvent) => {
      e.api.sizeColumnsToFit();
      setRowHeight(getRowHeight());
    },
    [setRowHeight],
  );

  const setGridColumnsState = (e: GridReadyEvent) => {
    if (view) {
      const model = getColumnsStateFromStorage(view);
      e.api.setFilterModel(model.filters);
      e.api.applyColumnState({
        state: model.columns,
      });
    }
  };

  const onGridReady = (e: GridReadyEvent) => {
    setGridApi(e.api);
    gridReadyCb?.(e.api);
    e.api.sizeColumnsToFit();
    e.api?.updateGridOptions({
      columnDefs,
      rowData,
    });
    setGridColumnsState(e);
  };

  useEffect(() => {
    gridApi?.updateGridOptions({
      columnDefs,
      rowData,
    });
  }, [columnDefs, gridApi, rowData]);

  return (
    <div className="ag-theme-balham-dark h-full overflow-x-auto" role="table">
      <AgGridReact
        rowModelType="clientSide"
        headerHeight={30}
        rowHeight={rowHeight}
        cellSelection={false}
        theme={themeBalham.withPart(colorSchemeDark).withParams({ ...GRID_THEME_COLORS })}
        autoSizeStrategy={{ type: 'fitGridWidth' }}
        tooltipShowDelay={500}
        defaultColDef={{
          minWidth: 150,
          flex: 1,
          floatingFilter: true,
          floatingFilterComponent: FloatingFilter,
          resizable: true,
          filter: 'agTextColumnFilter',
          filterParams: {
            filterPlaceholder: 'Enter value',
            buttons: ['reset'],
          } as ITextFilterParams,
          comparator: baseColumnComparator.bind(this),
          tooltipValueGetter: (p: ITooltipParams) => p.data?.[(p.colDef as ColDef)?.field || ''],
        }}
        onGridSizeChanged={onGridSizeChanged}
        onFilterChanged={onStateChanged}
        onSortChanged={onStateChanged}
        onGridReady={onGridReady}
        {...additionalGridOptions}
      />
    </div>
  );
};

export default Grid;

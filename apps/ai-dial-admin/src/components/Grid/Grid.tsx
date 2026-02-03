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
  ColumnState,
  EventApiModule,
  GridApi,
  GridOptions,
  GridReadyEvent,
  GridSizeChangedEvent,
  GridStateModule,
  InfiniteRowModelModule,
  ITextFilterParams,
  ITooltipParams,
  ModuleRegistry,
  NumberFilterModule,
  RenderApiModule,
  RowApiModule,
  RowDragModule,
  RowSelectionModule,
  RowStyleModule,
  SuppressKeyboardEventParams,
  TextFilterModule,
  themeBalham,
  TooltipModule,
  ScrollApiModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useState } from 'react';

import { baseColumnComparator } from './comparators/base-column-comparator';
import { ROW_HEIGHT } from './constants';
import FloatingFilter from './FloatingFilter/FloatingFilter';
import { getColumnsStateFromStorage, GridModel, saveColumnsStateToStorage } from './grid-columns';

interface Props<T> {
  columnDefs?: ColDef[];
  rowData?: T[];
  additionalGridOptions?: GridOptions;
  storageKey?: string;
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
  EventApiModule,
  ScrollApiModule,
]);

const GRID_THEME_COLORS = {
  accentColor: 'var(--controls-bg-solid-primary, #3970DA)',
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
  storageKey,
  onGridReady: gridReadyCb,
}: Props<T>) => {
  const [gridApi, setGridApi] = useState<GridApi>();

  const onStateChanged = useCallback(
    (e: AgGridEvent) => {
      if (storageKey) {
        const columns = e.api.getColumnState();
        const filters = e.api.getFilterModel();
        const model: GridModel = {
          columns,
          filters,
        };
        saveColumnsStateToStorage(storageKey, model);
      }
    },
    [storageKey],
  );

  const onGridSizeChanged = useCallback((e: GridSizeChangedEvent) => {
    e.api.sizeColumnsToFit();
  }, []);

  const setGridColumnsState = (e: GridReadyEvent, defaultSorts: ColumnState[]) => {
    if (storageKey) {
      const model = getColumnsStateFromStorage(storageKey, defaultSorts);
      e.api.setFilterModel(model.filters);
      e.api.applyColumnState({ state: model.columns });
    } else {
      e.api.applyColumnState({ state: defaultSorts });
    }
  };

  const onGridReady = (e: GridReadyEvent) => {
    setGridApi(e.api);
    gridReadyCb?.(e.api);
    e.api.sizeColumnsToFit();

    const defaultSorts =
      columnDefs
        ?.filter((col) => col.sort)
        .map(
          (col) =>
            ({
              colId: col.field,
              sort: col.sort,
            }) as ColumnState,
        ) || [];
    const columns = columnDefs?.map((col) => ({ ...col, sort: undefined }));
    e.api?.updateGridOptions({ columnDefs: columns, rowData });
    setGridColumnsState(e, defaultSorts);
  };

  useEffect(() => {
    const columns = columnDefs?.map((col) => ({ ...col, sort: undefined }));
    gridApi?.updateGridOptions({ columnDefs: columns, rowData });
  }, [columnDefs, gridApi, rowData]);

  const tooltipRenderer = (params: { value: string }) => {
    return (
      <div className="tooltip relative break-words">
        {params.value}
        <div className="absolute left-1/2 top-[-6px]">
          <div className="tooltip-arrow"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="ag-theme-balham-dark h-full overflow-x-auto" role="table">
      <AgGridReact
        rowModelType="clientSide"
        headerHeight={30}
        rowHeight={ROW_HEIGHT}
        cellSelection={false}
        theme={themeBalham.withPart(colorSchemeDark).withParams({ ...GRID_THEME_COLORS })}
        autoSizeStrategy={{ type: 'fitGridWidth' }}
        tooltipShowDelay={500}
        suppressDragLeaveHidesColumns={true}
        defaultColDef={{
          minWidth: 150,
          floatingFilter: true,
          floatingFilterComponent: FloatingFilter,
          resizable: true,
          flex: 1,
          filter: 'agTextColumnFilter',
          filterParams: {
            filterPlaceholder: 'Enter value',
            buttons: ['reset'],
          } as ITextFilterParams,
          comparator: baseColumnComparator.bind(this),
          tooltipValueGetter: (p: ITooltipParams) => p.data?.[(p.colDef as ColDef)?.field || ''],
          tooltipComponent: tooltipRenderer,
          suppressKeyboardEvent: (params: SuppressKeyboardEventParams) => {
            const event = params.event;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
              return true;
            }
            return false;
          },
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

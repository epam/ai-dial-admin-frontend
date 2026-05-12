'use client';

import {
  AgGridEvent,
  CellApiModule,
  CellContextMenuEvent,
  CellStyleModule,
  CheckboxEditorModule,
  ClientSideRowModelApiModule,
  ClientSideRowModelModule,
  ColDef,
  colorSchemeDark,
  ColumnApiModule,
  ColumnAutoSizeModule,
  ColumnState,
  DateFilterModule,
  EventApiModule,
  GetRowIdParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  GridStateModule,
  InfiniteRowModelModule,
  ITextFilterParams,
  ITooltipParams,
  ModuleRegistry,
  NumberFilterModule,
  PinnedRowModule,
  RenderApiModule,
  RowApiModule,
  RowDragModule,
  RowSelectionModule,
  RowStyleModule,
  ScrollApiModule,
  SuppressKeyboardEventParams,
  TextFilterModule,
  themeBalham,
  TooltipModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import CellContextMenu, { ContextMenuPosition } from './CellContextMenu/CellContextMenu';
import { baseColumnComparator } from './comparators/base-column-comparator';
import { ROW_HEIGHT } from './constants';
import FloatingFilter from './FloatingFilter/FloatingFilter';
import { getColumnsStateFromStorage, GridModel, saveColumnsStateToStorage } from './utils';

export interface AgGridProps<T> {
  columnDefs?: ColDef[];
  rowData?: T[] | null;
  additionalGridOptions?: Omit<GridOptions, 'columnDefs' | 'rowData' | 'onGridReady'>;
  storageKey?: string;
  onGridReady?: (gridApi: GridReadyEvent) => void;
  // Opt-in for live-streaming feeds: data flows as React props and
  // persisted state is restored on columnDefs/storageKey change rather
  // than on every rowData tick (default keeps the imperative path).
  isLiveData?: boolean;
  getRowId?: (params: GetRowIdParams<T>) => string;
  getHref?: (data: unknown) => string | undefined;
}

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
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
  CheckboxEditorModule,
  PinnedRowModule,
  DateFilterModule,
]);

const getDefaultSorts = (columnDefs: ColDef[] | undefined): ColumnState[] =>
  columnDefs?.filter((col) => col.sort).map((col) => ({ colId: col.field, sort: col.sort }) as ColumnState) ?? [];

const loadPersistedModel = (storageKey: string | undefined, defaultSorts: ColumnState[]): GridModel | null =>
  storageKey ? getColumnsStateFromStorage(storageKey, defaultSorts) : null;

const applyGridState = (gridApi: GridApi, model: GridModel | null, defaultSorts: ColumnState[]) => {
  if (model) {
    gridApi.setFilterModel(model.filters);
    gridApi.applyColumnState({ state: model.columns });
  } else {
    gridApi.applyColumnState({ state: defaultSorts });
  }
};

const mergeStoredColumnDefs = (columnDefs: ColDef[], stored: ColumnState[]): ColDef[] =>
  columnDefs.map((col) => {
    const fromStorage = stored?.find((s) => s.colId === col.colId) ?? {};
    return { ...fromStorage, ...col, sort: undefined };
  });

const GRID_THEME_COLORS = {
  accentColor: 'var(--controls-bg-solid-primary, #3664E2)',
  backgroundColor: 'var(--bg-layer-2, #161B2D)',
  borderColor: 'var(--bg-layer-4, #242C42)',
  borderRadius: 3,
  browserColorScheme: 'dark',
  chromeBackgroundColor: 'var(--bg-layer-1, #0C101D)',
  foregroundColor: 'var(--text-primary, #EEF1F7)',
  headerFontSize: 14,
  headerFontWeight: 600,
  headerTextColor: 'var(--text-secondary, #7F8792)',
  oddRowBackgroundColor: 'var(--bg-layer-3, #1D2439)',
  spacing: 4,
  wrapperBorderRadius: 3,
  fontSize: 14,
  fontFamily: {
    googleFont: 'var(--theme-font, var(--font-inter))',
  },
};

const AgGridWrapper = <T extends object>({
  columnDefs,
  rowData,
  additionalGridOptions,
  storageKey,
  onGridReady: gridReadyCb,
  isLiveData,
  getRowId,
  getHref,
}: AgGridProps<T>) => {
  const [gridApi, setGridApi] = useState<GridApi>();
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

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

  const setGridColumnsState = useCallback(
    (defaultSorts: ColumnState[]) => {
      if (!gridApi) return;
      const model = loadPersistedModel(storageKey, defaultSorts);
      const columns = model && columnDefs ? mergeStoredColumnDefs(columnDefs, model.columns) : columnDefs;
      gridApi.updateGridOptions({ columnDefs: columns, rowData });
      applyGridState(gridApi, model, defaultSorts);
    },
    [columnDefs, gridApi, rowData, storageKey],
  );

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);

    gridReadyCb?.(event);
  };

  useEffect(() => {
    if (isLiveData || !columnDefs) return;
    setGridColumnsState(getDefaultSorts(columnDefs));
  }, [columnDefs, gridApi, rowData, setGridColumnsState, storageKey, isLiveData]);

  useEffect(() => {
    if (!isLiveData || !columnDefs || !gridApi) return;
    const defaultSorts = getDefaultSorts(columnDefs);
    applyGridState(gridApi, loadPersistedModel(storageKey, defaultSorts), defaultSorts);
  }, [columnDefs, gridApi, storageKey, isLiveData]);

  const tooltipRenderer = (params: { value: string }) => {
    if (typeof params.value !== 'string') {
      return null;
    }
    return (
      <div className="tooltip relative break-words">
        {params.value}
        <div className="absolute left-1/2 top-[-6px]">
          <div className="tooltip-arrow"></div>
        </div>
      </div>
    );
  };

  const defaultColDef: ColDef = useMemo(() => {
    return {
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
    };
  }, []);

  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent) => {
      const mouseEvent = event.event as MouseEvent;
      mouseEvent.preventDefault();
      const formattedValue = event.api.getCellValue({
        rowNode: event.node!,
        colKey: event.column,
        useFormatter: true,
      });
      const displayValue = formattedValue ?? event.value;
      setContextMenu({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        value: displayValue != null ? String(displayValue) : '',
        href: getHref?.(event.data),
      });
    },
    [getHref],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleStateUpdated = useMemo(
    () =>
      debounce((e: AgGridEvent) => {
        onStateChanged(e);
      }, 300),
    [onStateChanged],
  );

  const liveDataProps = isLiveData ? { rowData, columnDefs, animateRows: false, getRowId } : {};

  return (
    <div className="ag-theme-balham-dark h-full overflow-x-auto" role="table">
      <AgGridReact
        rowModelType="clientSide"
        headerHeight={30}
        rowHeight={ROW_HEIGHT}
        cellSelection={false}
        theme={themeBalham.withPart(colorSchemeDark).withParams({ ...GRID_THEME_COLORS })}
        autoSizeStrategy={!storageKey ? { type: 'fitGridWidth' } : void 0}
        tooltipShowDelay={500}
        suppressDragLeaveHidesColumns={true}
        defaultColDef={defaultColDef}
        onFilterChanged={onStateChanged}
        onSortChanged={onStateChanged}
        onGridReady={onGridReady}
        onColumnMoved={handleStateUpdated}
        onColumnVisible={handleStateUpdated}
        onColumnResized={handleStateUpdated}
        onCellContextMenu={onCellContextMenu}
        preventDefaultOnContextMenu={true}
        {...liveDataProps}
        {...additionalGridOptions}
      />
      <CellContextMenu position={contextMenu} onClose={closeContextMenu} />
    </div>
  );
};

export default AgGridWrapper;

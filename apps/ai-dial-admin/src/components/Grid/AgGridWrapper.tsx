'use client';

import { Grid } from '@epam/ai-dial-ui-kit';
import {
  AgGridEvent,
  ColDef,
  ColGroupDef,
  ColumnResizedEvent,
  ColumnState,
  GetRowIdParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SuppressKeyboardEventParams,
} from 'ag-grid-community';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import DisplayNameCellRenderer from './CellRenderers/DisplayNameCellRenderer';
import RadioNameCellRenderer from './CellRenderers/RadioNameCellRenderer';
import { HEADER_HEIGHT, ICON_ROW_HEIGHT } from './constants';
import { useCellContextMenu } from './hooks/use-cell-context-menu';
import { getColumnsStateFromStorage, GridModel, saveColumnsStateToStorage, toColumnLeaves } from './utils';

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

const GRID_SIZED_RESIZE_SOURCES: ColumnResizedEvent['source'][] = ['autosizeColumns', 'sizeColumnsToFit'];

const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

const getDefaultSorts = (columnDefs: ColDef[] | undefined): ColumnState[] =>
  toColumnLeaves(columnDefs ?? [])
    .filter((col) => col.sort)
    .map((col) => ({ colId: col.field, sort: col.sort }) as ColumnState);

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

const suppressArrowKeys = (params: SuppressKeyboardEventParams) => ARROW_KEYS.includes(params.event.key);

const DEFAULT_COL_DEF: ColDef = { suppressKeyboardEvent: suppressArrowKeys };

const ICON_NAME_RENDERERS: ColDef['cellRenderer'][] = [DisplayNameCellRenderer, RadioNameCellRenderer];

const hasIconNameRenderer = (col: ColDef): boolean => ICON_NAME_RENDERERS.includes(col.cellRenderer);

const hasIconNameColumn = (columnDefs: ColDef[] | undefined): boolean =>
  (columnDefs ?? []).some((col) => {
    const children = (col as ColGroupDef).children;
    return Array.isArray(children) ? (children as ColDef[]).some(hasIconNameRenderer) : hasIconNameRenderer(col);
  });

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
  const { onCellContextMenu, getContextMenuItems } = useCellContextMenu<T>(getHref);

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

  const onGridApiChange = useCallback(
    (api: GridApi) => {
      setGridApi(api);
      gridReadyCb?.({ api, type: 'gridReady', context: api.getGridOption('context') } as GridReadyEvent);
    },
    [gridReadyCb],
  );

  const gridColumnDefs = useMemo(() => {
    if (isLiveData || !columnDefs || !storageKey || typeof window === 'undefined') return columnDefs;
    const model = loadPersistedModel(storageKey, getDefaultSorts(columnDefs));
    return model ? mergeStoredColumnDefs(columnDefs, model.columns) : columnDefs;
  }, [columnDefs, isLiveData, storageKey]);

  useEffect(() => {
    if (!columnDefs || !gridApi) return;
    const defaultSorts = getDefaultSorts(columnDefs);
    applyGridState(gridApi, loadPersistedModel(storageKey, defaultSorts), defaultSorts);
  }, [columnDefs, gridApi, storageKey]);

  const handleStateUpdated = useMemo(
    () =>
      debounce((e: AgGridEvent) => {
        onStateChanged(e);
      }, 300),
    [onStateChanged],
  );

  // Autosize and fit-grid-width dispatch columnResized too; persisting those would store a width
  // the operator never chose and freeze the first render's measurements on every later visit.
  const handleColumnResized = useCallback(
    (e: ColumnResizedEvent) => {
      if (GRID_SIZED_RESIZE_SOURCES.includes(e.source)) {
        return;
      }
      handleStateUpdated(e);
    },
    [handleStateUpdated],
  );

  const getRowIdFromRow = useCallback((row: T) => getRowId!({ data: row } as GetRowIdParams<T>), [getRowId]);

  // The kit grid fits columns to the viewport on every resize, which would discard persisted widths.
  const persistedWidthOptions: GridOptions = storageKey
    ? { autoSizeStrategy: undefined, onGridSizeChanged: undefined }
    : {};

  const hasIconName = useMemo(() => hasIconNameColumn(columnDefs), [columnDefs]);

  const gridOptions: GridOptions = {
    headerHeight: HEADER_HEIGHT,
    ...(hasIconName ? { rowHeight: ICON_ROW_HEIGHT } : {}),
    defaultColDef: DEFAULT_COL_DEF,
    onFilterChanged: onStateChanged,
    onSortChanged: onStateChanged,
    onColumnMoved: handleStateUpdated,
    onColumnVisible: handleStateUpdated,
    onColumnResized: handleColumnResized,
    onCellContextMenu,
    preventDefaultOnContextMenu: true,
    ...(isLiveData ? { animateRows: false } : {}),
    ...persistedWidthOptions,
    ...additionalGridOptions,
  };

  return (
    <Grid<T>
      columnDefs={gridColumnDefs}
      rowData={rowData ?? undefined}
      getRowId={isLiveData && getRowId ? getRowIdFromRow : undefined}
      getContextMenuItems={getContextMenuItems}
      onGridApiChange={onGridApiChange}
      additionalGridOptions={gridOptions}
    />
  );
};

export default AgGridWrapper;

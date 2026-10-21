'use client';

import { Grid, GridColorScheme } from '@epam/ai-dial-ui-kit';
import {
  ColDef,
  ColGroupDef,
  ColumnResizedEvent,
  GetRowIdParams,
  DisplayedColumnsChangedEvent,
  GridApi,
  GridColumnsChangedEvent,
  GridOptions,
  GridReadyEvent,
  GridSizeChangedEvent,
  SuppressKeyboardEventParams,
} from 'ag-grid-community';
import { useCallback, useMemo, useState } from 'react';

import { useTheme } from '@/src/context/ThemeContext';
import { EDITOR_THEMES } from '@/src/types/editor';

import DisplayNameCellRenderer from './CellRenderers/DisplayNameCellRenderer';
import FormattedValueCellRenderer from './CellRenderers/FormattedValueCellRenderer';
import RadioNameCellRenderer from './CellRenderers/RadioNameCellRenderer';
import FloatingFilter from './FloatingFilter/FloatingFilter';
import { HEADER_HEIGHT, ICON_ROW_HEIGHT } from './constants';
import { useCellContextMenu } from './hooks/use-cell-context-menu';
import { useGridStatePersistence } from './hooks/use-grid-state-persistence';
import { ColumnWidths } from './models';
import { withColumnWidths } from './utils';

export interface AgGridProps<T> {
  columnDefs?: ColDef[];
  rowData?: T[] | null;
  additionalGridOptions?: Omit<GridOptions, 'columnDefs' | 'rowData' | 'onGridReady'>;
  storageKey?: string;
  // Controlled alternative to `storageKey` for a grid whose owner keeps the widths in its own state,
  // so they outlive the grid's remount: the owner gets the full map back on every finished drag.
  columnWidths?: ColumnWidths;
  onColumnWidthsChange?: (widths: ColumnWidths) => void;
  onGridReady?: (gridApi: GridReadyEvent) => void;
  // Opt-in for live-streaming feeds: data flows as React props and
  // persisted state is restored on columnDefs/storageKey change rather
  // than on every rowData tick (default keeps the imperative path).
  isLiveData?: boolean;
  getRowId?: (params: GetRowIdParams<T>) => string;
  getHref?: (data: unknown) => string | undefined;
}

const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return TEXT_ENTRY_TAGS.has(target.tagName) || !!target.isContentEditable;
};

const suppressArrowKeys = (params: SuppressKeyboardEventParams) => {
  const key = params.event.key;
  if (ARROW_KEYS.includes(key)) return true;
  // Cell-renderer inputs are not AG Grid editors, so Ctrl/Cmd+A would select every row
  // and preventDefault would block selecting the field text. Suppress only that shortcut.
  const isSelectAll = (key === 'a' || key === 'A') && (params.event.ctrlKey || params.event.metaKey);
  return isSelectAll && isTextEntryTarget(params.event.target);
};

// The built-in floating filter waits for Enter when a filter includes an Apply button.
const DEFAULT_COL_DEF: ColDef = {
  floatingFilterComponent: FloatingFilter,
  suppressKeyboardEvent: suppressArrowKeys,
};

const withFormattedValueRenderer = (columnDefs: ColDef[]): ColDef[] =>
  columnDefs.map((col) => {
    const children = (col as ColGroupDef).children;
    if (Array.isArray(children)) {
      return { ...col, children: withFormattedValueRenderer(children as ColDef[]) } as ColDef;
    }
    return col.valueFormatter && !col.cellRenderer ? { ...col, cellRenderer: FormattedValueCellRenderer } : col;
  });

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
  columnWidths,
  onColumnWidthsChange,
  onGridReady: gridReadyCb,
  isLiveData,
  getRowId,
  getHref,
}: AgGridProps<T>) => {
  const [gridApi, setGridApi] = useState<GridApi>();
  const { currentTheme } = useTheme();
  const { onCellContextMenu, getContextMenuItems } = useCellContextMenu<T>(getHref);
  const colorScheme = currentTheme === EDITOR_THEMES.dark ? GridColorScheme.Dark : GridColorScheme.Light;

  const renderableColumnDefs = useMemo(
    () => (columnDefs ? withColumnWidths(withFormattedValueRenderer(columnDefs), columnWidths) : columnDefs),
    [columnDefs, columnWidths],
  );

  const {
    columnDefs: gridColumnDefs,
    onFilterChanged,
    onSortChanged,
    onColumnMoved,
    onColumnVisible,
    onColumnResized,
  } = useGridStatePersistence({
    storageKey,
    columnDefs: renderableColumnDefs,
    gridApi,
    shouldMergeColumnDefs: !isLiveData,
  });

  const onGridApiChange = useCallback(
    (api: GridApi) => {
      setGridApi(api);
      gridReadyCb?.({ api, type: 'gridReady', context: api.getGridOption('context') } as GridReadyEvent);
    },
    [gridReadyCb],
  );

  const onColumnResizedAndReport = useCallback(
    (e: ColumnResizedEvent) => {
      onColumnResized(e);
      if (e.finished && e.source === 'uiColumnResized') {
        onColumnWidthsChange?.({
          ...columnWidths,
          ...Object.fromEntries((e.columns ?? []).map((column) => [column.getColId(), column.getActualWidth()])),
        });
      }
    },
    [onColumnResized, columnWidths, onColumnWidthsChange],
  );

  const getRowIdFromRow = useCallback((row: T) => getRowId!({ data: row } as GetRowIdParams<T>), [getRowId]);

  // Drop the kit's fitGridWidth strategy so that automatic fit is not stored as an operator width.
  // Refit on size change the same way the kit does; a column the operator dragged stays put.
  const persistedWidthOptions: GridOptions = storageKey
    ? {
        autoSizeStrategy: undefined,
        onGridSizeChanged: (event: GridSizeChangedEvent) => {
          event.api.sizeColumnsToFit();
        },
      }
    : {};

  const hasIconName = useMemo(() => hasIconNameColumn(columnDefs), [columnDefs]);
  const { defaultColDef: additionalDefaultColDef, ...gridOptionOverrides } = additionalGridOptions ?? {};
  // A new object on every render is a defaultColDef change, and ag-Grid rebuilds the
  // columns from the definitions, which puts a drag back where it started.
  const defaultColDef = useMemo(() => ({ ...DEFAULT_COL_DEF, ...additionalDefaultColDef }), [additionalDefaultColDef]);

  const gridOptions: GridOptions = {
    headerHeight: HEADER_HEIGHT,
    ...(hasIconName ? { rowHeight: ICON_ROW_HEIGHT } : {}),
    onFilterChanged,
    onSortChanged,
    onColumnMoved,
    onColumnVisible,
    onColumnResized: onColumnResizedAndReport,
    onCellContextMenu,
    preventDefaultOnContextMenu: true,
    ...(isLiveData ? { animateRows: false } : {}),
    onGridColumnsChanged: (event: GridColumnsChangedEvent) => {
      event.api.sizeColumnsToFit();
    },
    onDisplayedColumnsChanged: (event: DisplayedColumnsChangedEvent) => {
      event.api.sizeColumnsToFit();
    },
    ...persistedWidthOptions,
    ...gridOptionOverrides,
    defaultColDef,
  };

  return (
    <Grid<T>
      columnDefs={gridColumnDefs}
      rowData={rowData ?? undefined}
      getRowId={isLiveData && getRowId ? getRowIdFromRow : undefined}
      getContextMenuItems={getContextMenuItems}
      onGridApiChange={onGridApiChange}
      additionalGridOptions={gridOptions}
      colorScheme={colorScheme}
    />
  );
};

export default AgGridWrapper;

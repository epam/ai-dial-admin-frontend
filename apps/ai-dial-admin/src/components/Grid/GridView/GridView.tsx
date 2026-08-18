'use client';
import { DialNoDataContent, DialNoDataContentProps } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import AgGridWrapper, { AgGridProps } from '@/src/components/Grid/AgGridWrapper';
import ColumnsPanel from '@/src/components/Grid/ColumnsPanel/ColumnsPanel';
import {
  checkColDefsChanges,
  checkGroupedColDefsChanges,
} from '@/src/components/Grid/comparators/base-column-comparator';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';

import {
  applyColumnStateOrderToColDefs,
  applyColumnStateOrderToGroupedColDefs,
  getColumnVisibilityFromGridState,
  getGroupedColumnVisibilityFromGridState,
  haveColDefsSamePanelState,
  haveGroupedColDefsSamePanelState,
  isGroupedColDefs,
  toColumnLeaves,
  updateColumnVisibilityInStorage,
  updateGroupedColumnVisibilityInStorage,
  withLeafMoved,
  withLeafVisibility,
} from '../utils';

export interface GridViewProps<T> extends AgGridProps<T> {
  emptyDataProps?: DialNoDataContentProps;
  getIsEmptyData?: () => boolean;

  showColumnsPanel?: boolean;
  toggleColumnsPanel?: () => void;
}

const GridView = <T extends object>({
  rowData,
  columnDefs,
  emptyDataProps,
  additionalGridOptions,
  showColumnsPanel,
  storageKey,
  toggleColumnsPanel,
  onGridReady,
  getIsEmptyData,
  isLiveData,
  getRowId,
  getHref,
}: GridViewProps<T>) => {
  const staticPanelContainerClassName = classNames(
    'left-0 top-0 size-full bg-blackout z-[15]',
    showColumnsPanel ? 'flex' : 'hidden',
  );

  const staticPanelClassName = classNames(
    'flex flex-col absolute right-0 top-0 bottom-0 bg-layer-3 z-10 divide-tertiary divide-y',
  );
  const isMobile = useIsMobileScreen();
  const isTablet = useIsOnlyTabletScreen();
  const [currentColDefs, setCurrentColDefs] = useState<ColDef[] | undefined>(undefined);
  const [showResetButton, setShowResetButton] = useState(false);
  const [panelContainerClassName, setPanelContainerClassName] = useState(staticPanelContainerClassName);
  const [panelClassName, setPanelClassName] = useState(staticPanelClassName);
  const gridApiRef = useRef<GridApi | null>(null);

  const isEmptyData = useMemo(
    () =>
      additionalGridOptions?.rowModelType === 'infinite'
        ? false
        : getIsEmptyData
          ? getIsEmptyData()
          : rowData == null || rowData.length === 0,
    [additionalGridOptions?.rowModelType, getIsEmptyData, rowData],
  );

  useEffect(() => {
    if (!columnDefs) {
      return;
    }

    if (showColumnsPanel) {
      if (currentColDefs == null || currentColDefs.length === 0) {
        const readStoredColumns = isGroupedColDefs(columnDefs)
          ? getGroupedColumnVisibilityFromGridState
          : getColumnVisibilityFromGridState;
        const storageColumns = storageKey ? readStoredColumns(storageKey, columnDefs) : null;
        setCurrentColDefs(
          !(storageColumns && columnDefs && columnDefs.length > storageColumns?.length)
            ? storageColumns || [...(columnDefs || [])]
            : [...columnDefs],
        );
        const hasChanges = isGroupedColDefs(columnDefs) ? checkGroupedColDefsChanges : checkColDefsChanges;
        setShowResetButton(storageColumns ? hasChanges(storageColumns, columnDefs || []) : false);
      }
      return;
    }

    setCurrentColDefs([...columnDefs]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnDefs, storageKey, showColumnsPanel]);

  useEffect(() => {
    setPanelContainerClassName(classNames(staticPanelContainerClassName, isMobile || isTablet ? 'fixed' : 'absolute'));

    setPanelClassName(
      classNames(
        staticPanelClassName,
        isMobile && 'w-full',
        isTablet && 'w-[350px]',
        !isMobile && !isTablet && 'w-[397px]',
      ),
    );
  }, [isMobile, isTablet, staticPanelContainerClassName, staticPanelClassName]);

  const isGrouped = useMemo(() => isGroupedColDefs(columnDefs), [columnDefs]);
  const columnLeaves = useMemo(() => toColumnLeaves(currentColDefs || []), [currentColDefs]);

  const persistVisibility = useCallback(
    (colDefs: ColDef[]) => {
      if (!storageKey) {
        return;
      }
      if (isGrouped) {
        updateGroupedColumnVisibilityInStorage(storageKey, colDefs);
        return;
      }
      updateColumnVisibilityInStorage(storageKey, colDefs);
    },
    [isGrouped, storageKey],
  );

  const hasPanelChanges = useCallback(
    (colDefs: ColDef[]) =>
      isGrouped
        ? checkGroupedColDefsChanges(colDefs, columnDefs || [])
        : checkColDefsChanges(colDefs, columnDefs || []),
    [isGrouped, columnDefs],
  );

  const clearSortAndFilter = useCallback((fields: string[]) => {
    if (!fields.length) {
      return;
    }

    gridApiRef.current?.applyColumnState({ state: fields.map((colId) => ({ colId, sort: null })) });

    const filterModel = gridApiRef.current?.getFilterModel();
    if (filterModel && fields.some((colId) => colId in filterModel)) {
      const remaining = Object.fromEntries(Object.entries(filterModel).filter(([colId]) => !fields.includes(colId)));
      gridApiRef.current?.setFilterModel(remaining);
    }
  }, []);

  const toggleColumnVisibility = useCallback(
    (id?: string) => {
      if (!currentColDefs || !id) {
        return;
      }

      const isHiding = !columnLeaves.find((leaf) => leaf.field === id)?.hide;
      if (isHiding) {
        clearSortAndFilter([id]);
      }

      const newColDefs = withLeafVisibility(currentColDefs, id, isHiding);
      setCurrentColDefs(newColDefs);
      persistVisibility(newColDefs);
      setShowResetButton(hasPanelChanges(newColDefs));
    },
    [currentColDefs, columnLeaves, clearSortAndFilter, hasPanelChanges, persistVisibility],
  );

  const onResetToDefault = () => {
    const defaults = columnDefs || [];
    const hiddenByReset = toColumnLeaves(defaults)
      .filter((leaf) => leaf.hide)
      .map((leaf) => leaf.field);
    clearSortAndFilter(hiddenByReset);

    setCurrentColDefs([...defaults]);
    persistVisibility(defaults);
    setShowResetButton(false);
  };

  const onFindColumn = useCallback(
    (field?: string) => columnLeaves.findIndex((leaf) => leaf.field === field),
    [columnLeaves],
  );

  const onMoveColumn = useCallback(
    (field: string, atIndex: number) => {
      if (!currentColDefs) {
        return;
      }

      const updatedColDefs = withLeafMoved(currentColDefs, field, atIndex);
      if (updatedColDefs === currentColDefs) {
        return;
      }

      persistVisibility(updatedColDefs);
      setCurrentColDefs(updatedColDefs);
      setShowResetButton(hasPanelChanges(updatedColDefs));
    },
    [currentColDefs, hasPanelChanges, persistVisibility],
  );

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      onGridReady?.(event);
    },
    [onGridReady],
  );

  useEffect(() => {
    if (!showColumnsPanel || !columnDefs?.length) {
      return;
    }

    const columnState = gridApiRef.current?.getColumnState();
    if (!columnState?.length) {
      return;
    }

    setCurrentColDefs((prevColDefs) => {
      if (!prevColDefs?.length) {
        return prevColDefs;
      }

      const grouped = isGroupedColDefs(prevColDefs);
      const syncedColDefs = grouped
        ? applyColumnStateOrderToGroupedColDefs(prevColDefs, columnState)
        : applyColumnStateOrderToColDefs(prevColDefs, columnState);
      const isSame = grouped
        ? haveGroupedColDefsSamePanelState(prevColDefs, syncedColDefs)
        : haveColDefsSamePanelState(prevColDefs, syncedColDefs);
      if (isSame) {
        return prevColDefs;
      }

      setShowResetButton(
        grouped
          ? checkGroupedColDefsChanges(syncedColDefs, columnDefs)
          : checkColDefsChanges(syncedColDefs, columnDefs),
      );
      return syncedColDefs;
    });
  }, [showColumnsPanel, columnDefs]);

  return (
    <div className="size-full relative">
      {isEmptyData && emptyDataProps ? (
        <DialNoDataContent {...emptyDataProps} />
      ) : (
        <>
          <AgGridWrapper
            columnDefs={currentColDefs}
            rowData={rowData}
            additionalGridOptions={additionalGridOptions}
            storageKey={storageKey}
            onGridReady={handleGridReady}
            isLiveData={isLiveData}
            getRowId={getRowId}
            getHref={getHref}
          />
          {showColumnsPanel && (
            <div className={panelContainerClassName}>
              <DndProvider backend={HTML5Backend}>
                <ColumnsPanel
                  columns={columnLeaves}
                  showResetButton={showResetButton}
                  panelClassName={panelClassName}
                  onReset={onResetToDefault}
                  toggleColumnsPanel={toggleColumnsPanel}
                  toggleColumnVisibility={toggleColumnVisibility}
                  onFind={onFindColumn}
                  onMove={onMoveColumn}
                />
              </DndProvider>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GridView;

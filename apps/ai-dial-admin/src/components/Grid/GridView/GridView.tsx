'use client';
import { DialNoDataContent, DialNoDataContentProps } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import AgGridWrapper, { AgGridProps } from '@/src/components/Grid/AgGridWrapper';
import ColumnsPanel from '@/src/components/Grid/ColumnsPanel/ColumnsPanel';
import { checkColDefsChanges } from '@/src/components/Grid/comparators/base-column-comparator';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';

import {
  applyColumnStateOrderToColDefs,
  getColumnVisibilityFromGridState,
  haveColDefsSamePanelState,
  updateColumnVisibilityInStorage,
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
        const storageColumns = storageKey ? getColumnVisibilityFromGridState(storageKey, columnDefs) : null;
        setCurrentColDefs(
          !(storageColumns && columnDefs && columnDefs.length > storageColumns?.length)
            ? storageColumns || [...(columnDefs || [])]
            : [...columnDefs],
        );
        setShowResetButton(storageColumns ? checkColDefsChanges(storageColumns, columnDefs || []) : false);
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

  const toggleColumnVisibility = useCallback(
    (id?: string) => {
      if (currentColDefs) {
        const newColDefs = currentColDefs?.map((c) => (c.field === id ? { ...c, hide: !c.hide } : c));
        setCurrentColDefs(newColDefs);
        if (storageKey) {
          updateColumnVisibilityInStorage(storageKey, newColDefs);
        }
        setShowResetButton(newColDefs.some((c, index) => c.hide !== columnDefs?.[index].hide));
      }
    },
    [currentColDefs, columnDefs, storageKey],
  );

  const onResetToDefault = () => {
    setCurrentColDefs([...(columnDefs || [])]);

    if (storageKey) {
      updateColumnVisibilityInStorage(storageKey, columnDefs || []);
    }
    setShowResetButton(false);
  };

  const onFindColumn = useCallback(
    (field?: string) => currentColDefs?.findIndex((c) => c.field === field),
    [currentColDefs],
  );

  const onMoveColumn = useCallback(
    (field: string, atIndex: number) => {
      const index = onFindColumn(field);
      if (index == null || index < 0) {
        return;
      }

      const updatedColDefs = [...(currentColDefs || [])];
      const [removedColDef] = updatedColDefs.splice(index, 1);
      updatedColDefs.splice(atIndex, 0, removedColDef);
      if (storageKey) {
        updateColumnVisibilityInStorage(storageKey, updatedColDefs);
      }
      setCurrentColDefs(updatedColDefs);
      setShowResetButton(checkColDefsChanges(updatedColDefs, columnDefs || []));
    },
    [onFindColumn, currentColDefs, columnDefs, storageKey],
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

      const syncedColDefs = applyColumnStateOrderToColDefs(prevColDefs, columnState);
      if (haveColDefsSamePanelState(prevColDefs, syncedColDefs)) {
        return prevColDefs;
      }

      setShowResetButton(checkColDefsChanges(syncedColDefs, columnDefs));
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
                  columns={currentColDefs || []}
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

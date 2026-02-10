'use client';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import AgGridWrapper, { AgGridProps } from '@/src/components/Grid/AgGridWrapper';
import ColumnsPanel from '@/src/components/Grid/ColumnsPanel/ColumnsPanel';
import { checkColDefsChanges } from '@/src/components/Grid/comparators/base-column-comparator';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { getColumnVisibilityFromStorage, saveColumnVisibilityToStorage } from '../utils';

interface Props<T> extends AgGridProps<T> {
  emptyDataTitle: string;
  emptyDataDescription?: string;

  showColumnsPanel?: boolean;
  toggleColumnsPanel?: () => void;
}

const GridView = <T extends object>({
  rowData,
  columnDefs,
  emptyDataTitle,
  emptyDataDescription,
  additionalGridOptions,
  showColumnsPanel,
  storageKey,
  toggleColumnsPanel,
  onGridReady,
}: Props<T>) => {
  const staticPanelContainerClassName = classNames(
    'left-0 top-0 w-full h-full bg-blackout z-50',
    showColumnsPanel ? 'flex' : 'hidden',
  );

  const staticPanelClassName = classNames(
    'flex flex-col absolute right-0 top-0 bottom-0 bg-layer-3 z-10 divide-tertiary divide-y',
  );
  const isMobile = useIsMobileScreen();
  const isTablet = useIsOnlyTabletScreen();
  const [currentColDefs, setCurrentColDefs] = useState<ColDef[]>([]);
  const [showResetButton, setShowResetButton] = useState(false);
  const [panelContainerClassName, setPanelContainerClassName] = useState(staticPanelContainerClassName);
  const [panelClassName, setPanelClassName] = useState(staticPanelClassName);

  useEffect(() => {
    if (currentColDefs == null || currentColDefs.length === 0) {
      const storageColumns = storageKey ? getColumnVisibilityFromStorage(columnDefs, storageKey) : null;
      setCurrentColDefs(
        !(storageColumns && columnDefs && columnDefs.length > storageColumns?.length)
          ? storageColumns || [...(columnDefs || [])]
          : [...columnDefs],
      );
      setShowResetButton(
        storageColumns ? storageColumns?.some((c, index) => c.hide !== columnDefs?.[index].hide) : false,
      );
    }
  }, [currentColDefs, columnDefs, storageKey]);

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
      const newColDefs = currentColDefs.map((c) => (c.field === id ? { ...c, hide: !c.hide } : c));
      setCurrentColDefs(newColDefs);
      if (storageKey) {
        saveColumnVisibilityToStorage(newColDefs, storageKey);
      }
      setShowResetButton(newColDefs.some((c, index) => c.hide !== columnDefs?.[index].hide));
    },
    [currentColDefs, columnDefs, storageKey],
  );

  const resetToDefault = () => {
    setCurrentColDefs([...(columnDefs || [])]);

    if (storageKey) {
      saveColumnVisibilityToStorage(columnDefs || [], storageKey);
    }
    setShowResetButton(false);
  };

  const findColumn = useCallback(
    (field?: string) => currentColDefs.findIndex((c) => c.field === field),
    [currentColDefs],
  );

  const moveColumn = useCallback(
    (field: string, atIndex: number) => {
      const index = findColumn(field);
      const updatedColDefs = [...currentColDefs];
      const [removedColDef] = updatedColDefs.splice(index, 1);
      updatedColDefs.splice(atIndex, 0, removedColDef);
      if (storageKey) {
        saveColumnVisibilityToStorage(updatedColDefs, storageKey);
      }
      setCurrentColDefs(updatedColDefs);
      setShowResetButton(checkColDefsChanges(updatedColDefs, columnDefs || []));
    },
    [findColumn, currentColDefs, setShowResetButton, columnDefs, storageKey],
  );

  return (
    <div className="w-full h-full relative">
      {rowData != null && rowData?.length === 0 ? (
        <DialNoDataContent title={emptyDataTitle} description={emptyDataDescription} containerClassName="small" />
      ) : (
        <>
          <AgGridWrapper
            columnDefs={currentColDefs}
            rowData={rowData}
            additionalGridOptions={additionalGridOptions}
            storageKey={storageKey}
            onGridReady={onGridReady}
          />
          {showColumnsPanel && (
            <div className={panelContainerClassName}>
              <DndProvider backend={HTML5Backend}>
                <ColumnsPanel
                  columns={currentColDefs}
                  showResetButton={showResetButton}
                  panelClassName={panelClassName}
                  onReset={resetToDefault}
                  toggleColumnsPanel={toggleColumnsPanel}
                  toggleColumnVisibility={toggleColumnVisibility}
                  onFind={findColumn}
                  onMove={moveColumn}
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

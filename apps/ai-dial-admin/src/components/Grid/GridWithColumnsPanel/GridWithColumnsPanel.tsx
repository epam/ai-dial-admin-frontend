'use client';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { checkColDefsChanges } from '@/src/components/Grid/comparators/base-column-comparator';
import ColumnsPanel from '@/src/components/Grid/ColumnsPanel/ColumnsPanel';
import Grid from '@/src/components/Grid/Grid';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { getColumnVisibilityFromStorage, saveColumnVisibilityToStorage } from '../grid-columns';

interface Props<T> {
  data?: T[];
  columnDefs: ColDef[];
  emptyDataTitle: string;
  emptyDataDescription?: string;
  additionalGridOptions?: GridOptions;
  showColumnsPanel?: boolean;
  storageKey?: string;
  toggleColumnsPanel?: () => void;
  onGridReady?: (gridApi: GridApi) => void;
}

const GridWithColumnsPanel = <T extends object>({
  data,
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
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [showResetButton, setShowResetButton] = useState(false);
  const [panelContainerClassName, setPanelContainerClassName] = useState(staticPanelContainerClassName);
  const [panelClassName, setPanelClassName] = useState(staticPanelClassName);

  useEffect(() => {
    if (colDefs == null || colDefs.length === 0) {
      const storageColumns = storageKey ? getColumnVisibilityFromStorage(columnDefs, storageKey) : null;
      setColDefs(
        !(storageColumns && columnDefs.length > storageColumns?.length)
          ? storageColumns || [...columnDefs]
          : [...columnDefs],
      );
      setShowResetButton(
        storageColumns ? storageColumns?.some((c, index) => c.hide !== columnDefs[index].hide) : false,
      );
    }
  }, [colDefs, columnDefs, storageKey]);

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
      const newColDefs = colDefs.map((c) => (c.field === id ? { ...c, hide: !c.hide } : c));
      setColDefs(newColDefs);
      if (storageKey) {
        saveColumnVisibilityToStorage(newColDefs, storageKey);
      }
      setShowResetButton(newColDefs.some((c, index) => c.hide !== columnDefs[index].hide));
    },
    [colDefs, columnDefs, storageKey],
  );

  const resetToDefault = () => {
    setColDefs([...columnDefs]);

    if (storageKey) {
      saveColumnVisibilityToStorage(columnDefs, storageKey);
    }
    setShowResetButton(false);
  };

  const findColumn = useCallback((field?: string) => colDefs.findIndex((c) => c.field === field), [colDefs]);

  const moveColumn = useCallback(
    (field: string, atIndex: number) => {
      const index = findColumn(field);
      const updatedColDefs = [...colDefs];
      const [removedColDef] = updatedColDefs.splice(index, 1);
      updatedColDefs.splice(atIndex, 0, removedColDef);
      if (storageKey) {
        saveColumnVisibilityToStorage(updatedColDefs, storageKey);
      }
      setColDefs(updatedColDefs);
      setShowResetButton(checkColDefsChanges(updatedColDefs, columnDefs));
    },
    [findColumn, colDefs, setShowResetButton, columnDefs, storageKey],
  );

  return (
    <div className="w-full h-full relative">
      {data != null && data?.length === 0 ? (
        <DialNoDataContent title={emptyDataTitle} description={emptyDataDescription} containerClassName="small" />
      ) : (
        <>
          <Grid
            columnDefs={colDefs}
            rowData={data}
            additionalGridOptions={additionalGridOptions}
            storageKey={storageKey}
            onGridReady={onGridReady}
          />
          {showColumnsPanel && (
            <div className={panelContainerClassName}>
              <DndProvider backend={HTML5Backend}>
                <ColumnsPanel
                  columns={colDefs}
                  showResetButton={showResetButton}
                  panelClassName={panelClassName}
                  resetToDefault={resetToDefault}
                  toggleColumnsPanel={toggleColumnsPanel}
                  toggleColumnVisibility={toggleColumnVisibility}
                  findColumn={findColumn}
                  moveColumn={moveColumn}
                />
              </DndProvider>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GridWithColumnsPanel;

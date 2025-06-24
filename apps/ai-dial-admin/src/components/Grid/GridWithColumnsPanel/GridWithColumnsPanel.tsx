'use client';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { checkColDefsChanges } from '@/src/components/Grid/comparators/base-column-comparator';
import ColumnsPanel from '@/src/components/Grid/ColumnsPanel/ColumnsPanel';
import Grid from '@/src/components/Grid/Grid';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { ApplicationRoute } from '@/src/types/routes';
import { getColumnVisibilityFromStorage, saveColumnVisibilityToStorage } from '../grid-columns';

interface Props<T> {
  data?: T[];
  columnDefs: ColDef[];
  emptyDataTitle: string;
  additionalGridOptions?: GridOptions;
  showColumnsPanel?: boolean;
  view?: ApplicationRoute;
  toggleColumnsPanel?: () => void;
  onGridReady?: (gridApi: GridApi) => void;
}

const GridWithColumnsPanel = <T extends object>({
  data,
  columnDefs,
  emptyDataTitle,
  additionalGridOptions,
  showColumnsPanel,
  view,
  toggleColumnsPanel,
  onGridReady,
}: Props<T>) => {
  const staticPanelContainerClassNames = classNames(
    'left-0 top-0 w-full h-full bg-blackout z-50',
    `${showColumnsPanel ? 'flex' : 'hidden'}`,
  );

  const staticPanelClassNames = classNames(
    'flex flex-col absolute right-0 top-0 bottom-0 bg-layer-3 z-10 divide-tertiary divide-y',
  );
  const isMobile = useIsMobileScreen();
  const isTablet = useIsOnlyTabletScreen();
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [showResetButton, setShowResetButton] = useState(false);
  const [panelContainerClassNames, setPanelContainerClassNames] = useState(staticPanelContainerClassNames);
  const [panelClassNames, setPanelClassNames] = useState(staticPanelClassNames);

  useEffect(() => {
    if (colDefs == null || colDefs.length === 0) {
      const storageColumns = view ? getColumnVisibilityFromStorage(columnDefs, view) : null;
      setColDefs(storageColumns || [...columnDefs]);
      setShowResetButton(
        storageColumns ? storageColumns?.some((c, index) => c.hide !== columnDefs[index].hide) : false,
      );
    }
  }, [colDefs, columnDefs, view]);

  useEffect(() => {
    setPanelContainerClassNames(
      classNames(staticPanelContainerClassNames, `${isMobile || isTablet ? 'fixed' : 'absolute'}`),
    );

    setPanelClassNames(
      classNames(
        staticPanelClassNames,
        `${isMobile ? 'w-full' : 'w-[397px]'}`,
        `${isTablet ? 'w-[350px]' : 'w-[397px]'}`,
      ),
    );
  }, [isMobile, isTablet, staticPanelContainerClassNames, staticPanelClassNames]);

  const toggleColumnVisibility = useCallback(
    (id?: string) => {
      const newColDefs = colDefs.map((c) => (c.field === id ? { ...c, hide: !c.hide } : c));
      setColDefs(newColDefs);
      if (view) {
        saveColumnVisibilityToStorage(newColDefs, view);
      }
      setShowResetButton(newColDefs.some((c, index) => c.hide !== columnDefs[index].hide));
    },
    [colDefs, columnDefs, view],
  );

  const resetToDefault = () => {
    setColDefs([...columnDefs]);

    if (view) {
      saveColumnVisibilityToStorage(columnDefs, view);
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
      if (view) {
        saveColumnVisibilityToStorage(updatedColDefs, view);
      }
      setColDefs(updatedColDefs);
      setShowResetButton(checkColDefsChanges(updatedColDefs, columnDefs));
    },
    [findColumn, colDefs, setShowResetButton, columnDefs, view],
  );

  return (
    <div className="w-full h-full relative">
      {data?.length === 0 ? (
        <NoDataContent emptyDataTitle={emptyDataTitle} />
      ) : (
        <>
          <Grid
            columnDefs={colDefs}
            rowData={data}
            additionalGridOptions={additionalGridOptions}
            view={view}
            onGridReady={onGridReady}
          />
          {showColumnsPanel && (
            <div className={panelContainerClassNames}>
              <DndProvider backend={HTML5Backend}>
                <ColumnsPanel
                  columns={colDefs}
                  showResetButton={showResetButton}
                  panelClassNames={panelClassNames}
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

'use client';

import {
  ColDef,
  FirstDataRenderedEvent,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  RowHeightParams,
} from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import ColorScale, { ColorScaleVariant } from '@/src/components/Common/ColorScale/ColorScale';
import { HEAT_MAP_ROW_HEIGHT, HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE } from '@/src/components/Common/HeatMap/constants';
import { HeatMapGridRow } from '@/src/components/Common/HeatMap/models';
import { centerHeatMapTooltipPopup } from '@/src/components/Common/HeatMap/utils/center-heat-map-tooltip-popup';
import {
  applyHeatMapColumnWidths,
  getHeatMapValueColumnWidth,
  resolveHeatMapHeaderHeight,
  resolveHeatMapRowHeight,
} from '@/src/components/Common/HeatMap/utils/heat-map-layout';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props<T extends HeatMapGridRow> {
  columnDefs: ColDef<T>[];
  rowData: T[];
  headerLabels: string[];
  emptyTitle: string;
  valueColumnIdPrefix?: string;
  colorScaleVariant?: ColorScaleVariant;
  gridKey?: string;
  className?: string;
  showColorScale?: boolean;
}

const HeatMapGrid = <T extends HeatMapGridRow>({
  columnDefs,
  rowData,
  headerLabels,
  emptyTitle,
  valueColumnIdPrefix = HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE,
  colorScaleVariant = ColorScaleVariant.Compact,
  gridKey,
  className,
  showColorScale = true,
}: Props<T>) => {
  const gridApiRef = useRef<GridApi | null>(null);

  const fitHeatMapColumns = useCallback(
    (api: GridApi) => {
      const centerViewport = document.querySelector('.heat-map-grid .ag-center-cols-viewport') as HTMLElement | null;
      const availableForValueColumns = centerViewport?.clientWidth ?? 0;
      applyHeatMapColumnWidths(api, availableForValueColumns, valueColumnIdPrefix);

      const valueColumnWidth = getHeatMapValueColumnWidth(api, valueColumnIdPrefix);
      const headerHeight = resolveHeatMapHeaderHeight(valueColumnWidth, headerLabels);
      api.setGridOption('headerHeight', headerHeight);
      api.resetRowHeights();
      api.refreshHeader();
      api.refreshCells({ force: true });
    },
    [headerLabels, valueColumnIdPrefix],
  );

  useEffect(() => {
    if (!gridApiRef.current || !columnDefs.length) {
      return;
    }
    fitHeatMapColumns(gridApiRef.current);
  }, [columnDefs, fitHeatMapColumns]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      fitHeatMapColumns(event.api);
    },
    [fitHeatMapColumns],
  );

  const gridOptions = useMemo(
    () => ({
      headerHeight: resolveHeatMapHeaderHeight(0, headerLabels),
      hidePaddedHeaderRows: false,
      rowHeight: HEAT_MAP_ROW_HEIGHT,
      suppressHorizontalScroll: false,
      alwaysShowHorizontalScroll: false,
      autoSizeStrategy: undefined,
      getRowHeight: (params: RowHeightParams<T>) => {
        const valueColumnWidth = params.api ? getHeatMapValueColumnWidth(params.api, valueColumnIdPrefix) : 0;
        return resolveHeatMapRowHeight(valueColumnWidth);
      },
      defaultColDef: {
        filter: false,
        floatingFilter: false,
        resizable: false,
        sortable: false,
      },
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        fitHeatMapColumns(event.api);
      },
      onNewColumnsLoaded: (event: { api: GridApi }) => {
        fitHeatMapColumns(event.api);
      },
      onGridSizeChanged: (event: { api: GridApi }) => {
        fitHeatMapColumns(event.api);
      },
      onColumnResized: (event: { api: GridApi; finished: boolean | undefined }) => {
        if (event.finished) {
          event.api.resetRowHeights();
          event.api.refreshCells({ force: true });
        }
      },
      postProcessPopup: centerHeatMapTooltipPopup,
    }),
    [fitHeatMapColumns, headerLabels, valueColumnIdPrefix],
  );

  const getRowId = useCallback(({ data }: GetRowIdParams<T>) => data.id, []);

  return (
    <div className={className ?? 'flex flex-col flex-1 min-h-0 h-full overflow-hidden gap-6'}>
      <div className="flex-1 min-h-0 overflow-hidden heat-map-grid">
        <GridView
          key={gridKey}
          columnDefs={columnDefs}
          rowData={rowData}
          additionalGridOptions={gridOptions}
          emptyDataProps={{ title: emptyTitle }}
          getRowId={getRowId}
          onGridReady={onGridReady}
        />
      </div>

      {showColorScale && (
        <div className="flex justify-start shrink-0 pb-2">
          <ColorScale variant={colorScaleVariant} />
        </div>
      )}
    </div>
  );
};

export default HeatMapGrid;

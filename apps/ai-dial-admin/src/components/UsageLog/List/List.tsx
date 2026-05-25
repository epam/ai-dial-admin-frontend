'use client';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useMemo } from 'react';

import ListEntities from '@/src/components/ListView/List';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';

import { KEEP_GRID_MOUNTED, getRowId } from './utils';
import { useUsageLogData } from './useUsageLogData';

interface Props {
  route: ApplicationRoute;
  query: TelemetryQuery;
  columnDefs: ColDef[];
  listLabel: string;
  emptyDataTitle: string;
  timeRange: TimeRange;
  entityName: string | null;

  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  onGridReady?: (event: GridReadyEvent) => void;
}

const NoRowsOverlay: FC<{ title: string }> = ({ title }) => <DialNoDataContent title={title} />;

const List: FC<Props> = ({
  route,
  getData,
  query,
  columnDefs,
  listLabel,
  emptyDataTitle,
  timeRange,
  entityName,
  onGridReady,
}) => {
  const { rowData, onBodyScroll, onSortChanged, onFilterChanged, setGridApi } = useUsageLogData({
    query,
    timeRange,
    entityName,
    getData,
  });

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      onGridReady?.(event);
    },
    [setGridApi, onGridReady],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      multiSort: false,
      noRowsOverlayComponent: NoRowsOverlay,
      noRowsOverlayComponentParams: { title: emptyDataTitle },
      onBodyScroll,
      onSortChanged,
      onFilterChanged,
    }),
    [emptyDataTitle, onBodyScroll, onSortChanged, onFilterChanged],
  );

  return (
    <ListEntities
      columnDefs={columnDefs}
      rowData={rowData}
      listLabel={listLabel}
      emptyDataProps={{ title: emptyDataTitle }}
      storageKey={`${route}/${listLabel}`}
      additionalGridOptions={additionalGridOptions}
      onGridReady={handleGridReady}
      getIsEmptyData={KEEP_GRID_MOUNTED}
      getRowId={getRowId}
      isEnableColumnPanel
      isMainListView
      isLiveData
    />
  );
};

export default List;

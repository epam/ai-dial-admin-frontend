'use client';

import { ColDef, GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import ListEntities from '@/src/components/ListView/List';
import { infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { buildUsageLogQuery, getListingData } from '@/src/utils/telemetry';

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

const List: FC<Props> = ({
  route,
  getData,
  query,
  columnDefs,
  listLabel,
  emptyDataTitle,
  timeRange,
  entityName,
  onGridReady: onGridReadyCallback,
}) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const paginatedQuery = buildUsageLogQuery({
          baseQuery: query,
          startRow: params.startRow,
          pageSize: PAGE_SIZE,
          sortModel: params.sortModel,
          filterModel: params.filterModel,
          timeRange,
          entityName,
        });

        getData(paginatedQuery)
          .then((response) => {
            if (response.success) {
              const rows = getListingData(response.response as TelemetryData);
              const lastRow = rows.length < PAGE_SIZE ? params.startRow + rows.length : -1;
              params.successCallback(rows, lastRow);
            } else {
              params.failCallback();
            }
            gridApi?.setGridOption('loading', false);
          })
          .catch((error) => {
            console.error(`Getting usage log view data error: ${error}`);
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, getData, query, timeRange, entityName],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      onGridReadyCallback?.(event);
    },
    [onGridReadyCallback],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      ...infiniteGridOptions,
      multiSort: false,
      overlayNoRowsTemplate: `<span class="ag-overlay-no-rows-center">${emptyDataTitle}</span>`,
    }),
    [emptyDataTitle],
  );

  return (
    <ListEntities
      columnDefs={columnDefs}
      listLabel={listLabel}
      emptyDataProps={{ title: emptyDataTitle }}
      storageKey={`${route}/${listLabel}`}
      additionalGridOptions={additionalGridOptions}
      onGridReady={onGridReady}
      isEnableColumnPanel
      isMainListView
    />
  );
};

export default List;

'use client';

import {
  BodyScrollEvent,
  ColDef,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SortChangedEvent,
  SortModelItem,
} from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ListEntities from '@/src/components/ListView/List';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery, UsageLogFilterModel } from '@/src/models/telemetry';
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

const DAY_MS = 24 * 60 * 60 * 1000;
const SCROLL_END_THRESHOLD_ROWS = 20;
const MIN_ROWS_TO_ENABLE_SCROLL = 100;

const buildDayQueue = (timeRange: TimeRange): TimeRange[] => {
  const fromMs = timeRange.startDate.getTime();
  const toMs = timeRange.endDate.getTime();
  if (toMs <= fromMs) {
    return [];
  }
  const queue: TimeRange[] = [];
  let cursor = toMs;
  while (cursor > fromMs) {
    const windowStart = Math.max(fromMs, cursor - DAY_MS);
    queue.push({ startDate: new Date(windowStart), endDate: new Date(cursor) });
    cursor = windowStart;
  }
  return queue;
};

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
  const [rowData, setRowData] = useState<Record<string, string>[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const gridApiRef = useRef<GridApi | null>(null);
  const dayQueueRef = useRef<TimeRange[]>([]);
  const loadingRef = useRef(false);
  const totalLoadedRef = useRef(0);
  const rowIdCounterRef = useRef(0);
  const sortModelRef = useRef<SortModelItem[]>([]);
  const filterModelRef = useRef<UsageLogFilterModel | null>(null);
  const requestIdRef = useRef(0);

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || dayQueueRef.current.length === 0) {
      return;
    }
    loadingRef.current = true;
    gridApiRef.current?.setGridOption('loading', true);
    const requestId = ++requestIdRef.current;
    const dayWindow = dayQueueRef.current.shift()!;
    let shouldAutoFetch = false;

    try {
      const nextQuery = buildUsageLogQuery({
        baseQuery: query,
        offset: 0,
        sortModel: sortModelRef.current,
        filterModel: filterModelRef.current,
        timeRange: dayWindow,
        entityName,
      });
      const response = await getData(nextQuery);
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (!response.success) {
        return;
      }
      const newRows = getListingData(response.response as TelemetryData);
      if (newRows.length > 0) {
        const tagged = newRows.map((row) => ({ ...row, __rowId: String(rowIdCounterRef.current++) }));
        setRowData((prev) => [...prev, ...tagged]);
        totalLoadedRef.current += newRows.length;
      }
      const remainingDays = dayQueueRef.current.length;
      console.info(
        `[UsageLog] day [${dayWindow.startDate.toISOString()}, ${dayWindow.endDate.toISOString()}) returned ${newRows.length} rows (total loaded: ${totalLoadedRef.current}, days remaining: ${remainingDays})`,
      );
      shouldAutoFetch =
        remainingDays > 0 && (newRows.length === 0 || totalLoadedRef.current < MIN_ROWS_TO_ENABLE_SCROLL);
    } catch (error) {
      console.error(`Getting usage log view data error: ${error}`);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        gridApiRef.current?.setGridOption('loading', false);
        setHasLoadedOnce(true);
        if (shouldAutoFetch) {
          fetchMore();
        }
      }
    }
  }, [getData, query, entityName]);

  const reset = useCallback(() => {
    requestIdRef.current++;
    loadingRef.current = false;
    totalLoadedRef.current = 0;
    rowIdCounterRef.current = 0;
    dayQueueRef.current = buildDayQueue(timeRange);
    setRowData([]);
    setHasLoadedOnce(false);
  }, [timeRange]);

  useEffect(() => {
    reset();
    if (dayQueueRef.current.length === 0) {
      setHasLoadedOnce(true);
    } else {
      fetchMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, timeRange, entityName]);

  const onBodyScroll = useCallback(
    (event: BodyScrollEvent) => {
      if (loadingRef.current || dayQueueRef.current.length === 0) {
        return;
      }
      const lastDisplayed = event.api.getLastDisplayedRowIndex();
      const totalRows = event.api.getDisplayedRowCount();
      if (totalRows > 0 && lastDisplayed >= totalRows - SCROLL_END_THRESHOLD_ROWS) {
        fetchMore();
      }
    },
    [fetchMore],
  );

  const onSortChanged = useCallback(
    (event: SortChangedEvent) => {
      const newSortModel = event.api
        .getColumnState()
        .filter((s) => s.sort)
        .map((s) => ({ colId: s.colId, sort: s.sort }) as SortModelItem);
      sortModelRef.current = newSortModel;
      reset();
      fetchMore();
    },
    [reset, fetchMore],
  );

  const onFilterChanged = useCallback(
    (event: FilterChangedEvent) => {
      filterModelRef.current = event.api.getFilterModel() as UsageLogFilterModel;
      reset();
      fetchMore();
    },
    [reset, fetchMore],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      event.api.setGridOption('loading', !hasLoadedOnce);
      onGridReadyCallback?.(event);
    },
    [hasLoadedOnce, onGridReadyCallback],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      multiSort: false,
      overlayNoRowsTemplate: `<span class="ag-overlay-no-rows-center">${emptyDataTitle}</span>`,
      onBodyScroll,
      onSortChanged,
      onFilterChanged,
    }),
    [emptyDataTitle, onBodyScroll, onSortChanged, onFilterChanged],
  );

  const getIsEmptyData = useCallback(() => hasLoadedOnce && rowData.length === 0, [hasLoadedOnce, rowData.length]);

  return (
    <ListEntities
      columnDefs={columnDefs}
      rowData={rowData}
      listLabel={listLabel}
      emptyDataProps={{ title: emptyDataTitle }}
      storageKey={`${route}/${listLabel}`}
      additionalGridOptions={additionalGridOptions}
      onGridReady={onGridReady}
      getIsEmptyData={getIsEmptyData}
      getRowId={(p) => p.data.__rowId as string}
      isEnableColumnPanel
      isMainListView
      isLiveData
    />
  );
};

export default List;

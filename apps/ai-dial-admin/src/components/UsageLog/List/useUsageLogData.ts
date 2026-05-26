import { BodyScrollEvent, FilterChangedEvent, GridApi, SortChangedEvent } from 'ag-grid-community';
import { isEqual } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery, UsageLogFilterModel } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { getErrorNotification } from '@/src/utils/notification';
import { buildUsageLogQuery, getListingData } from '@/src/utils/telemetry';

import {
  DEFAULT_SORT_DIRECTION,
  MIN_ROWS_TO_ENABLE_SCROLL,
  ResetInput,
  SCROLL_END_THRESHOLD_ROWS,
  SortDirection,
  buildDayQueue,
  buildSortModel,
  getNextSortDirection,
  tagRowsWithIds,
} from './utils';

interface UseUsageLogDataInput {
  query: TelemetryQuery;
  timeRange: TimeRange;
  entityName: string | null;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
}

interface UseUsageLogDataResult {
  rowData: Record<string, string>[];
  onBodyScroll: (event: BodyScrollEvent) => void;
  onSortChanged: (event: SortChangedEvent) => void;
  onFilterChanged: (event: FilterChangedEvent) => void;
  setGridApi: (api: GridApi) => void;
}

export const useUsageLogData = ({
  query,
  timeRange,
  entityName,
  getData,
}: UseUsageLogDataInput): UseUsageLogDataResult => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [rowData, setRowData] = useState<Record<string, string>[]>([]);

  const gridApiRef = useRef<GridApi | null>(null);
  const dayQueueRef = useRef<TimeRange[]>([]);
  const loadingRef = useRef(false);
  const totalLoadedRef = useRef(0);
  const rowIdCounterRef = useRef(0);
  const sortDirectionRef = useRef<SortDirection>(DEFAULT_SORT_DIRECTION);
  const filterModelRef = useRef<UsageLogFilterModel | null>(null);
  const requestIdRef = useRef(0);
  const firstAfterResetRef = useRef(true);

  const setLoading = useCallback((loading: boolean) => {
    loadingRef.current = loading;
    gridApiRef.current?.setGridOption('loading', loading);
  }, []);

  const notifyFetchError = useCallback(
    (response?: ServerActionResponse) => {
      if (response) {
        showNotification(getErrorNotification(response.errorHeader, response.errorMessage, response.requestId));
      } else {
        showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
      }
    },
    [showNotification, t],
  );

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || dayQueueRef.current.length === 0) {
      return;
    }
    setLoading(true);
    const requestId = ++requestIdRef.current;
    const dayWindow = dayQueueRef.current.shift()!;
    let shouldAutoFetch = false;

    try {
      const nextQuery = buildUsageLogQuery({
        baseQuery: query,
        offset: 0,
        sortModel: buildSortModel(sortDirectionRef.current),
        filterModel: filterModelRef.current,
        timeRange: dayWindow,
        entityName,
      });
      const response = await getData(nextQuery);
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (!response.success) {
        // Re-queue this window so a transient backend error doesn't permanently
        // strip a day of data — user can retry by scrolling or reloading.
        dayQueueRef.current.unshift(dayWindow);
        notifyFetchError(response);
        return;
      }
      const newRows = getListingData(response.response as TelemetryData);
      const { tagged, nextCounter } = tagRowsWithIds(newRows, rowIdCounterRef.current);
      rowIdCounterRef.current = nextCounter;
      totalLoadedRef.current += newRows.length;

      if (firstAfterResetRef.current) {
        setRowData(tagged);
        firstAfterResetRef.current = false;
      } else if (newRows.length > 0) {
        setRowData((prev) => [...prev, ...tagged]);
      }

      const remainingDays = dayQueueRef.current.length;
      shouldAutoFetch =
        remainingDays > 0 && (newRows.length === 0 || totalLoadedRef.current < MIN_ROWS_TO_ENABLE_SCROLL);
    } catch {
      if (requestId === requestIdRef.current) {
        // Same re-queue rationale as the !success branch above.
        dayQueueRef.current.unshift(dayWindow);
        notifyFetchError();
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        if (shouldAutoFetch) {
          fetchMore();
        }
      }
    }
  }, [getData, query, entityName, setLoading, notifyFetchError]);

  const restart = useCallback(
    ({ timeRange: nextRange, sortDirection, filterModel }: ResetInput) => {
      requestIdRef.current++;
      loadingRef.current = false;
      totalLoadedRef.current = 0;
      rowIdCounterRef.current = 0;
      sortDirectionRef.current = sortDirection;
      filterModelRef.current = filterModel;
      dayQueueRef.current = buildDayQueue(nextRange, sortDirection);
      firstAfterResetRef.current = true;
      // Degenerate range (endDate <= startDate) produces an empty queue and no
      // fetch will fire, so clear rowData here — otherwise the previous range's
      // rows stay visible indefinitely.
      if (dayQueueRef.current.length === 0) {
        setRowData([]);
        return;
      }
      fetchMore();
    },
    [fetchMore],
  );

  useEffect(() => {
    restart({
      timeRange,
      sortDirection: sortDirectionRef.current,
      filterModel: filterModelRef.current,
    });
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
      const nextDirection = getNextSortDirection(event.api.getColumnState());
      if (nextDirection === sortDirectionRef.current) {
        return;
      }
      restart({ timeRange, sortDirection: nextDirection, filterModel: filterModelRef.current });
    },
    [restart, timeRange],
  );

  const onFilterChanged = useCallback(
    (event: FilterChangedEvent) => {
      const nextFilter = event.api.getFilterModel() as UsageLogFilterModel;
      // ag-grid emits filterChanged on mount and column-state restore even
      // when the model is unchanged. Skip those — otherwise the bootstrap
      // useEffect's in-flight fetch gets invalidated and the queue shifts
      // forward with no replacement data. Treat null and {} as equivalent
      // (translateUsageLogFilterModel handles both as "no filters").
      if (isEqual(nextFilter ?? {}, filterModelRef.current ?? {})) {
        return;
      }
      restart({ timeRange, sortDirection: sortDirectionRef.current, filterModel: nextFilter });
    },
    [restart, timeRange],
  );

  const setGridApi = useCallback((api: GridApi) => {
    gridApiRef.current = api;
    // setLoading short-circuited when gridApiRef was null; push the current
    // value now that the grid is ready so the loading overlay shows on the
    // first in-flight fetch.
    api.setGridOption('loading', loadingRef.current);
  }, []);

  return { rowData, onBodyScroll, onSortChanged, onFilterChanged, setGridApi };
};

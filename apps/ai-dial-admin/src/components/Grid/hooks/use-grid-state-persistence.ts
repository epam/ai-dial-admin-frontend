import { AgGridEvent, ColumnResizedEvent, GridApi } from 'ag-grid-community';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GRID_SIZED_RESIZE_SOURCES, GRID_STATE_SAVE_DEBOUNCE_MS } from '@/src/components/Grid/constants';
import { GridStatePersistenceProps } from '@/src/components/Grid/models';
import {
  applyGridState,
  columnStateToStore,
  getDefaultSorts,
  GridModel,
  loadPersistedModel,
  mergeColumnOrder,
  mergeStoredColumnDefs,
  saveColumnsStateToStorage,
} from '@/src/components/Grid/utils';

/**
 * Stores the grid state the operator chose under `storageKey` and restores it: filters, column state, and
 * the width of each column the operator dragged — never a width the grid computed itself.
 */
export const useGridStatePersistence = ({
  storageKey,
  columnDefs,
  gridApi,
  persistedFields,
  userResizeSources,
  shouldRestoreOrder = false,
  shouldMergeColumnDefs = true,
}: GridStatePersistenceProps) => {
  const sizedColIdsRef = useRef<Set<string>>(new Set());
  // Until the stored state reaches the grid, an event from its setup (an empty filter model) would
  // overwrite the stored state it is about to restore.
  const isStateAppliedRef = useRef(false);
  // Bumped once a finished drag is stored, so the merged definitions carry that width: a host that rebuilds
  // the grid's columns (the file-manager library does on every loading or selection change) re-applies the
  // definitions' widths, and stale ones would put the drag back.
  const [storedWidthsRevision, setStoredWidthsRevision] = useState(0);

  const onStateChanged = useCallback(
    (e: AgGridEvent) => {
      if (!storageKey || !isStateAppliedRef.current) {
        return;
      }
      const sizedColIds = [...sizedColIdsRef.current];
      const current = columnStateToStore(e.api.getColumnState(), sizedColIdsRef.current, persistedFields);
      const stored = shouldRestoreOrder ? (loadPersistedModel(storageKey, [])?.columns ?? []) : [];
      const model: GridModel = {
        columns: shouldRestoreOrder ? mergeColumnOrder(current, stored) : current,
        filters: e.api.getFilterModel(),
        sizedColIds,
      };
      saveColumnsStateToStorage(storageKey, model);
    },
    [storageKey, persistedFields, shouldRestoreOrder],
  );

  const onStateUpdated = useMemo(
    () => debounce((e: AgGridEvent) => onStateChanged(e), GRID_STATE_SAVE_DEBOUNCE_MS),
    [onStateChanged],
  );

  const onDragFinishedUpdated = useMemo(
    () =>
      debounce((e: AgGridEvent) => {
        onStateChanged(e);
        setStoredWidthsRevision((revision) => revision + 1);
      }, GRID_STATE_SAVE_DEBOUNCE_MS),
    [onStateChanged],
  );

  useEffect(() => {
    isStateAppliedRef.current = false;
    sizedColIdsRef.current = new Set(storageKey ? (loadPersistedModel(storageKey, [])?.sizedColIds ?? []) : []);
  }, [storageKey]);

  const reapplyState = useCallback(
    (api: GridApi) => {
      if (!columnDefs) return;
      const defaultSorts = getDefaultSorts(columnDefs);
      applyGridState(api, loadPersistedModel(storageKey, defaultSorts), defaultSorts, shouldRestoreOrder);
      isStateAppliedRef.current = true;
    },
    [columnDefs, storageKey, shouldRestoreOrder],
  );

  useEffect(() => {
    if (gridApi) reapplyState(gridApi);
  }, [gridApi, reapplyState]);

  const mergedColumnDefs = useMemo(() => {
    if (!columnDefs || !shouldMergeColumnDefs || !storageKey || typeof window === 'undefined') return columnDefs;
    const model = loadPersistedModel(storageKey, getDefaultSorts(columnDefs));
    return model ? mergeStoredColumnDefs(columnDefs, model.columns, model.sizedColIds ?? []) : columnDefs;
    // `storedWidthsRevision` re-reads the stored model, which the memo reads from storage, not from state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnDefs, shouldMergeColumnDefs, storageKey, storedWidthsRevision]);

  // Autosize and fit-grid-width dispatch columnResized too; persisting those would store a width
  // the operator never chose and freeze the first render's measurements on every later visit.
  // A grid of flex columns also reports layout resizes, and while a header is dragged each event lists
  // every flex column that moved — there only the finished event names just the column the operator sized.
  const onColumnResized = useCallback(
    (e: ColumnResizedEvent) => {
      const isUserResize = userResizeSources
        ? userResizeSources.includes(e.source) && e.finished
        : !GRID_SIZED_RESIZE_SOURCES.includes(e.source);
      if (!isUserResize) {
        return;
      }
      e.columns?.forEach((column) => {
        column.getColDef().suppressSizeToFit = true;
        const id = column.getColId();
        if (id) sizedColIdsRef.current.add(id);
      });
      if (!e.finished) {
        onStateUpdated(e);
        return;
      }
      onDragFinishedUpdated(e);
      if (e.source === 'uiColumnResized') {
        e.api.sizeColumnsToFit();
      }
    },
    [userResizeSources, onStateUpdated, onDragFinishedUpdated],
  );

  return {
    columnDefs: mergedColumnDefs,
    onFilterChanged: onStateChanged,
    onSortChanged: onStateChanged,
    onColumnMoved: onStateUpdated,
    onColumnVisible: onStateUpdated,
    onColumnResized,
    reapplyState,
  };
};

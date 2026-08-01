import { FilterChangedEvent, GetRowIdParams, GridApi, GridReadyEvent, RowHeightParams } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROW_HEIGHT, STACKED_LINE_HEIGHT, STACKED_ROW_PADDING } from '@/src/components/Grid/constants';
import { GridRowType, GroupedGridRow, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { groupTestCaseRows, projectGroupsToGridRows } from '@/src/utils/evaluation/test-case-grouping';

export interface TurnGroupProjectionConfig {
  rawRows: TestCaseRow[];
  onGridReady?: (event: GridReadyEvent) => void;
}

export const useTurnGroupProjection = ({ rawRows, onGridReady: onGridReadyConfig }: TurnGroupProjectionConfig) => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const groups = useMemo(() => groupTestCaseRows(rawRows), [rawRows]);

  useEffect(() => {
    const multiTurnKeys = new Set(groups.filter((group) => group.isMulti).map((group) => group.key));
    setExpandedKeys((prev) => {
      const next = new Set([...prev].filter((key) => multiTurnKeys.has(key)));
      return next.size === prev.size ? prev : next;
    });
  }, [groups]);

  const rowData = useMemo(
    () => projectGroupsToGridRows(groups, expandedKeys, isSearching),
    [groups, expandedKeys, isSearching],
  );

  useEffect(() => {
    const api = gridApiRef.current;
    // The parent remounts this grid on discard, and the effect below still runs once against the
    // torn-down api — ag-grid logs a warning for every call made after destruction.
    if (!api || api.isDestroyed()) return;
    // ag-grid only re-renders a custom cell renderer when the displayed *value* changes, but the
    // chevron is driven by `data.expanded` rather than any column value, so a toggle would
    // otherwise leave the previously rendered chevron state on screen.
    api.refreshCells({ force: true });
    // A GROUP row keeps its `getRowId` identity across a toggle, so ag-grid reuses the node and its
    // cached height — an expanded group would stay at its collapsed stacked height. Row height is
    // asked for again only on reset.
    api.resetRowHeights();
  }, [rowData]);

  const onToggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const expandGroup = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const onFilterChanged = useCallback((event: FilterChangedEvent) => {
    setIsSearching(Object.keys(event.api.getFilterModel()).length > 0);
  }, []);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      onGridReadyConfig?.(event);
    },
    [onGridReadyConfig],
  );

  const getRowId = useCallback((params: GetRowIdParams<GroupedGridRow>) => {
    const row = params.data;
    // Every turn of a case shares the case `id`, so `id` alone collides across rows of the same
    // case — qualify by row type plus whatever distinguishes rows within that type.
    switch (row.rowType) {
      case GridRowType.GROUP:
        return `group:${row.groupKey}`;
      case GridRowType.TURN:
        return `turn:${row.groupKey}:${row.turnNumber}`;
      default:
        return `single:${row.id}`;
    }
  }, []);

  const getRowHeight = useCallback((params: RowHeightParams<GroupedGridRow>) => {
    const row = params.data;
    // Only a collapsed GROUP row stacks its turns and needs extra height; an expanded group is
    // just a single-line header, and every other row type is already a single editable line.
    if (row?.rowType === GridRowType.GROUP && !row.expanded) {
      return Math.max(ROW_HEIGHT, (row.turnCount ?? 1) * STACKED_LINE_HEIGHT + STACKED_ROW_PADDING);
    }
    return ROW_HEIGHT;
  }, []);

  return {
    groups,
    rowData,
    isSearching,
    onToggleExpand,
    expandGroup,
    onFilterChanged,
    onGridReady,
    getRowId,
    getRowHeight,
  };
};

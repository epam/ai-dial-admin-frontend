'use client';

import { FilterChangedEvent, GetRowIdParams, GridApi, GridReadyEvent, RowHeightParams } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROW_HEIGHT } from '@/src/components/Grid/constants';
import { GridRowType, GroupedGridRow, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { groupTestCaseRows, projectGroupsToGridRows } from '@/src/utils/evaluation/test-case-grouping';

/** Height (px) a single stacked turn line occupies in a GROUP summary row. */
const STACKED_LINE_HEIGHT = 22;
const STACKED_ROW_PADDING = 10;

export interface TurnGroupProjectionConfig {
  /** Flat backend grid rows (test cases or run results) to group by shared `id` + `_turnIndex`. */
  rawRows: TestCaseRow[];
  /** When true, multi-turn groups start expanded and `toggledKeys` tracks the collapsed ones. */
  defaultExpanded?: boolean;
  /** When true, single-turn cases are floated to the top of the list ahead of multi-turn ones. */
  singlesFirst?: boolean;
  onGridReady?: (event: GridReadyEvent) => void;
}

/**
 * Read-only core of the multi-turn grid primitive: groups flat rows into logical multi-turn
 * cases/conversations, projects the collapsible row model, and tracks expand/collapse + search
 * state. Shared by the editable test-case grid hook (`useTurnGroupGrid`) and the read-only run
 * results grid. Holds no persistence — callers add any CRUD on top.
 */
export const useTurnGroupProjection = ({
  rawRows,
  defaultExpanded = false,
  singlesFirst = false,
  onGridReady,
}: TurnGroupProjectionConfig) => {
  // Keys the user toggled away from the default: expanded groups when collapsed-by-default,
  // collapsed groups when expanded-by-default.
  const [toggledKeys, setToggledKeys] = useState<Set<string>>(() => new Set());
  const [isSearching, setIsSearching] = useState(false);
  const gridApiRef = useRef<GridApi | null>(null);

  const groups = useMemo(() => groupTestCaseRows(rawRows), [rawRows]);
  const rowData = useMemo(
    () => projectGroupsToGridRows(groups, toggledKeys, isSearching, defaultExpanded, singlesFirst),
    [groups, toggledKeys, isSearching, defaultExpanded, singlesFirst],
  );

  // AG Grid only refreshes custom renderers when the displayed value changes; the chevron is driven
  // by `data.expanded`, so force a refresh after every projection change.
  useEffect(() => {
    gridApiRef.current?.refreshCells({ force: true });
  }, [rowData]);

  // Drop toggled keys for groups that no longer exist after a reload.
  useEffect(() => {
    const liveKeys = new Set(groups.filter((group) => group.isMulti).map((group) => group.key));
    setToggledKeys((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((key) => {
        if (liveKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [groups]);

  const onToggleExpand = useCallback((key: string) => {
    setToggledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  /** Ensure a group is expanded regardless of the default (used after a structural change). */
  const expandGroup = useCallback(
    (key: string) => {
      setToggledKeys((prev) => {
        // Expanded when `defaultExpanded XOR has(key)`; to open, the key must be absent when
        // expanded-by-default and present when collapsed-by-default.
        const shouldContainKey = !defaultExpanded;
        if (prev.has(key) === shouldContainKey) return prev;
        const next = new Set(prev);
        if (shouldContainKey) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [defaultExpanded],
  );

  const onFilterChanged = useCallback((event: FilterChangedEvent) => {
    setIsSearching(Object.keys(event.api.getFilterModel()).length > 0);
  }, []);

  const onGridReadyInternal = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      onGridReady?.(event);
    },
    [onGridReady],
  );

  const getRowId = useCallback((params: GetRowIdParams<GroupedGridRow>) => String(params.data.id), []);

  const getRowHeight = useCallback((params: RowHeightParams<GroupedGridRow>) => {
    // Only a collapsed GROUP row stacks its turns and needs the extra height; an expanded group is a
    // single-line header (its turn rows carry the detail).
    if (params.data?.rowType === GridRowType.GROUP && !params.data.expanded) {
      return Math.max(ROW_HEIGHT, (params.data.turnCount ?? 1) * STACKED_LINE_HEIGHT + STACKED_ROW_PADDING);
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
    onGridReady: onGridReadyInternal,
    getRowId,
    getRowHeight,
  };
};

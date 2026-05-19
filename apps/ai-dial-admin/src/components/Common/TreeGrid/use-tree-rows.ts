import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { flattenTree, overlayExpandedState } from './utils';
import { TreeRow } from './types';

export function useTreeRows<T>(tree: TreeRow<T>[]) {
  const [expandedState, setExpandedState] = useState<Map<string, boolean>>(() => new Map());
  const gridApiRef = useRef<GridApi | null>(null);

  useEffect(() => {
    const currentIds = new Set<string>();
    const collectIds = (rows: TreeRow<T>[]) => {
      for (const row of rows) {
        currentIds.add(row.id);
        collectIds(row.children);
      }
    };
    collectIds(tree);

    setExpandedState((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const id of prev.keys()) {
        if (!currentIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tree]);

  const currentTree = useMemo(() => overlayExpandedState(tree, expandedState), [tree, expandedState]);

  const flatRows = useMemo(() => flattenTree(currentTree), [currentTree]);

  // AG Grid only refreshes custom cell renderers when the displayed value changes;
  // the expander chevron is driven by `data.expanded`, so we must force a refresh
  // after every toggle or the icon stays stale even though flatRows is up to date.
  useEffect(() => {
    gridApiRef.current?.refreshCells({ force: true });
  }, [flatRows]);

  const onToggleExpand = useCallback((row: TreeRow<T>) => {
    setExpandedState((prev) => {
      const next = new Map(prev);
      const isExpanded = prev.has(row.id) ? (prev.get(row.id) as boolean) : row.expanded;
      next.set(row.id, !isExpanded);
      return next;
    });
  }, []);

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);

  return { flatRows, onToggleExpand, onGridReady };
}

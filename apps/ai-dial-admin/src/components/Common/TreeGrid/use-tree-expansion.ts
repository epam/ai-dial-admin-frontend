import { useCallback, useEffect, useMemo, useState } from 'react';

import { overlayExpandedState } from './utils';
import { TreeRow } from './types';

export interface TreeExpansionOptions {
  isDefaultExpanded?: boolean;
}

export function useTreeExpansion<T>(tree: TreeRow<T>[], { isDefaultExpanded = false }: TreeExpansionOptions = {}) {
  const [expandedState, setExpandedState] = useState<Map<string, boolean>>(() => new Map());

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

  const currentTree = useMemo(
    () => overlayExpandedState(tree, expandedState, isDefaultExpanded ? true : undefined),
    [tree, expandedState, isDefaultExpanded],
  );

  const onToggleExpand = useCallback((row: TreeRow<T>) => {
    setExpandedState((prev) => {
      const next = new Map(prev);
      const isExpanded = prev.has(row.id) ? (prev.get(row.id) as boolean) : row.expanded;
      next.set(row.id, !isExpanded);
      return next;
    });
  }, []);

  return { currentTree, onToggleExpand };
}

import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTreeExpansion } from './use-tree-expansion';
import { flattenTree } from './utils';
import { TreeRow } from './types';

export function useTreeRows<T>(tree: TreeRow<T>[]) {
  const gridApiRef = useRef<GridApi | null>(null);
  const { currentTree, onToggleExpand } = useTreeExpansion<T>(tree);

  const flatRows = useMemo(() => flattenTree(currentTree), [currentTree]);

  // AG Grid only refreshes custom cell renderers when the displayed value changes;
  // the expander chevron is driven by `data.expanded`, so we must force a refresh
  // after every toggle or the icon stays stale even though flatRows is up to date.
  useEffect(() => {
    gridApiRef.current?.refreshCells({ force: true });
  }, [flatRows]);

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);

  return { flatRows, onToggleExpand, onGridReady };
}

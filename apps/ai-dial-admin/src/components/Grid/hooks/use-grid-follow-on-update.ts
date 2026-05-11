import { GridApi } from 'ag-grid-community';
import { useEffect, useLayoutEffect, useRef } from 'react';

type Anchor = { kind: 'top' } | { kind: 'row'; rowId: string; offset: number };

interface UseGridFollowOnUpdateParams<T> {
  gridApi: GridApi | null | undefined;
  rowData: T[] | null | undefined;
  getRowId: (params: { data: T }) => string;
  getViewportEl?: () => HTMLElement | null;
}

const AT_TOP_TOLERANCE_PX = 8;

const defaultGetViewportEl = (): HTMLElement | null =>
  typeof document !== 'undefined' ? (document.querySelector('.ag-body-viewport') as HTMLElement | null) : null;

const captureAnchor = <T>(gridApi: GridApi, getRowId: (params: { data: T }) => string): Anchor | null => {
  const viewportTop = gridApi.getVerticalPixelRange()?.top ?? 0;
  if (viewportTop < AT_TOP_TOLERANCE_PX) return { kind: 'top' };

  // The first RENDERED row may sit in AG Grid's overscan buffer above
  // the viewport; pick the first row whose pixels actually intersect
  // the viewport top.
  const firstRendered = gridApi.getFirstDisplayedRowIndex();
  const lastRendered = gridApi.getLastDisplayedRowIndex() ?? firstRendered;
  if (firstRendered < 0) return null;

  for (let i = firstRendered; i <= lastRendered; i++) {
    const node = gridApi.getDisplayedRowAtIndex(i);
    if (node?.rowTop == null || node.rowHeight == null || !node.data) continue;
    if (node.rowTop + node.rowHeight > viewportTop) {
      return {
        kind: 'row',
        rowId: getRowId({ data: node.data as T }),
        offset: node.rowTop - viewportTop,
      };
    }
  }

  return null;
};

const restoreAnchor = (gridApi: GridApi, anchor: Anchor, viewport: HTMLElement | null) => {
  if (anchor.kind === 'top') {
    gridApi.ensureIndexVisible(0, 'top');
    return;
  }

  const node = gridApi.getRowNode(anchor.rowId);
  if (node?.rowIndex == null || node.rowTop == null) return;

  gridApi.ensureIndexVisible(node.rowIndex, 'top');
  if (viewport) {
    viewport.scrollTop = Math.max(0, node.rowTop - anchor.offset);
  }
};

export const useGridFollowOnUpdate = <T>({
  gridApi,
  rowData,
  getRowId,
  getViewportEl = defaultGetViewportEl,
}: UseGridFollowOnUpdateParams<T>) => {
  const pendingAnchorRef = useRef<Anchor | null>(null);
  const dropNextRef = useRef(false);
  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;
  const getViewportElRef = useRef(getViewportEl);
  getViewportElRef.current = getViewportEl;

  // ag-grid-react v35 applies prop changes inside a useEffect, so this
  // useLayoutEffect runs in the same commit phase BEFORE the grid model
  // is updated — gridApi here still reflects the pre-update scroll.
  useLayoutEffect(() => {
    if (!gridApi) return;
    pendingAnchorRef.current = captureAnchor(gridApi, getRowIdRef.current);
  }, [rowData, gridApi]);

  // modelUpdated is the authoritative post-update signal under React 19;
  // ag-grid-react may queue prop processing asynchronously.
  useEffect(() => {
    if (!gridApi) return;

    const dropAnchor = () => {
      dropNextRef.current = true;
    };

    const onModelUpdated = () => {
      if (dropNextRef.current) {
        dropNextRef.current = false;
        pendingAnchorRef.current = null;
        return;
      }
      const anchor = pendingAnchorRef.current;
      pendingAnchorRef.current = null;
      if (anchor) restoreAnchor(gridApi, anchor, getViewportElRef.current());
    };

    gridApi.addEventListener('modelUpdated', onModelUpdated);
    gridApi.addEventListener('sortChanged', dropAnchor);
    gridApi.addEventListener('filterChanged', dropAnchor);

    return () => {
      gridApi.removeEventListener('modelUpdated', onModelUpdated);
      gridApi.removeEventListener('sortChanged', dropAnchor);
      gridApi.removeEventListener('filterChanged', dropAnchor);
    };
  }, [gridApi]);
};

'use client';

import { useCallback, useEffect, useRef } from 'react';

import { GridApi, IRowNode } from 'ag-grid-community';

/**
 * Sizes full-width rows from what they actually rendered.
 *
 * A `ResizeObserver` rather than a measurement on every render: it reports only when the box really
 * changes — the timestamp landing after mount, a reflow when the card's scrollbar appears — and it
 * does so off the render path, so nothing forces a synchronous layout to find out.
 *
 * **One** observer for the grid, disconnected when the grid goes, with each element's row node in a
 * weak map rather than captured — which is what lets the ref callback stay stable across renders.
 * One observer per detail row leaked them instead, since nothing disconnected the ones a closed row
 * left behind.
 */
export const useMeasuredRows = (api: GridApi | null) => {
  // Read by the one resize observer below, which must not be rebuilt when the api arrives.
  const apiRef = useRef<GridApi | null>(null);
  apiRef.current = api;

  const nodes = useRef(new WeakMap<Element, IRowNode>());
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const instance = new ResizeObserver((entries) => {
      let isChanged = false;

      for (const entry of entries) {
        const node = nodes.current.get(entry.target);
        const height = Math.ceil(entry.contentRect.height);
        if (!node || !height || node.rowHeight === height) continue;

        node.setRowHeight(height);
        isChanged = true;
      }

      if (isChanged && !apiRef.current?.isDestroyed()) apiRef.current?.onRowHeightChanged();
    });

    observer.current = instance;

    return () => instance.disconnect();
  }, []);

  useEffect(() => {
    if (api && !api.isDestroyed()) api.onRowHeightChanged();
  }, [api]);

  /**
   * React 19 runs the function a ref callback returns when the element goes, with the element still
   * in hand — the only moment an `unobserve` is possible. Without it the observer held on to every
   * detail element it had ever seen, and through the weak map to their row nodes with them.
   */
  return useCallback(
    (node: IRowNode) => (element: HTMLDivElement | null) => {
      if (!element) return;

      nodes.current.set(element, node);
      observer.current?.observe(element);

      return () => observer.current?.unobserve(element);
    },
    [],
  );
};

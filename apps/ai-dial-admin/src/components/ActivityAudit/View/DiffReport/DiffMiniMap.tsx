'use client';

import { FC, MouseEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { computeMinimapMarkers, MinimapMarker } from '@/src/components/ActivityAudit/View/DiffReport/minimap-utils';
import { DiffStatus } from '@/src/types/activity-audit';

interface Props {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

const MARKER_BG: Record<string, string> = {
  [DiffStatus.ADDED]: 'bg-success',
  [DiffStatus.REMOVED]: 'bg-error',
  [DiffStatus.CHANGED]: 'bg-info',
};

const MARKER_BORDER: Record<string, string> = {
  [DiffStatus.ADDED]: 'border border-success',
  [DiffStatus.REMOVED]: 'border border-error',
  [DiffStatus.CHANGED]: 'border border-info',
};

const DiffMiniMap: FC<Props> = ({ scrollContainerRef }) => {
  const [markers, setMarkers] = useState<MinimapMarker[]>([]);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(1);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isThumbDragging = useRef(false);
  const thumbDragStartY = useRef(0);
  const thumbDragStartScrollTop = useRef(0);

  const updateThumb = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setThumbTop(scrollTop / scrollHeight);
    setThumbHeight(clientHeight / scrollHeight);
  }, [scrollContainerRef]);

  const recalculate = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setMarkers(computeMinimapMarkers(container));
    updateThumb();
  }, [scrollContainerRef, updateThumb]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(recalculate);
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(() => requestAnimationFrame(recalculate));
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    requestAnimationFrame(recalculate);

    container.addEventListener('scroll', updateThumb);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', updateThumb);
    };
  }, [scrollContainerRef, recalculate, updateThumb]);

  const scrollToClientY = useCallback(
    (clientY: number) => {
      const container = scrollContainerRef.current;
      const miniMap = miniMapRef.current;
      if (!container || !miniMap) return;

      const rect = miniMap.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const target = ratio * container.scrollHeight - container.clientHeight / 2;
      container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, Math.max(0, target));
    },
    [scrollContainerRef],
  );

  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDragging.current = true;
      scrollToClientY(e.clientY);
    },
    [scrollToClientY],
  );

  const onThumbMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      isThumbDragging.current = true;
      thumbDragStartY.current = e.clientY;
      thumbDragStartScrollTop.current = scrollContainerRef.current?.scrollTop ?? 0;
    },
    [scrollContainerRef],
  );

  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (isThumbDragging.current) {
        const container = scrollContainerRef.current;
        const miniMap = miniMapRef.current;
        if (!container || !miniMap) return;

        const rect = miniMap.getBoundingClientRect();
        const scrollDelta = ((e.clientY - thumbDragStartY.current) / rect.height) * container.scrollHeight;
        container.scrollTop = Math.min(
          container.scrollHeight - container.clientHeight,
          Math.max(0, thumbDragStartScrollTop.current + scrollDelta),
        );
        return;
      }

      if (!isDragging.current) return;
      scrollToClientY(e.clientY);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      isThumbDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [scrollToClientY, scrollContainerRef]);

  return (
    <div
      ref={miniMapRef}
      className="absolute right-0 top-0 bottom-0 w-4 bg-layer-3 border-l border-secondary cursor-pointer z-10 select-none"
      onMouseDown={onMouseDown}
      role="navigation"
    >
      {markers.map((marker, i) => (
        <div
          key={i}
          className={classNames(
            'absolute left-0 right-0 opacity-90 rounded-sm',
            MARKER_BG[marker.status],
            MARKER_BORDER[marker.status],
          )}
          style={{ top: `${marker.position * 100}%`, height: `${marker.height * 100}%` }}
        />
      ))}
      <div
        className="absolute left-0 right-0 bg-inverted opacity-5 border-y border-secondary cursor-pointer"
        onMouseDown={onThumbMouseDown}
        style={{ top: `${thumbTop * 100}%`, height: `${thumbHeight * 100}%` }}
      />
    </div>
  );
};

export default DiffMiniMap;

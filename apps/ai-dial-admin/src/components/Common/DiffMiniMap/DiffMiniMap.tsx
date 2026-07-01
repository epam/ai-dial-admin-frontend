'use client';

import { FC, MouseEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import {
  computeHorizontalMinimapMarkers,
  computeMinimapMarkers,
  MinimapMarker,
} from '@/src/components/Common/DiffMiniMap/minimap-utils';
import { DiffStatus } from '@/src/types/activity-audit';

interface Props {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  isHorizontal?: boolean;
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

const DiffMiniMap: FC<Props> = ({ scrollContainerRef, isHorizontal = false }) => {
  const [markers, setMarkers] = useState<MinimapMarker[]>([]);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [thumbSize, setThumbSize] = useState(1);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isThumbDragging = useRef(false);
  const thumbDragStartCoord = useRef(0);
  const thumbDragStartScroll = useRef(0);

  const updateThumb = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isHorizontal) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setThumbOffset(scrollWidth === 0 ? 0 : scrollLeft / scrollWidth);
      setThumbSize(scrollWidth === 0 ? 1 : clientWidth / scrollWidth);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    setThumbOffset(scrollTop / scrollHeight);
    setThumbSize(clientHeight / scrollHeight);
  }, [scrollContainerRef, isHorizontal]);

  const recalculate = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setMarkers(isHorizontal ? computeHorizontalMinimapMarkers(container) : computeMinimapMarkers(container));
    updateThumb();
  }, [scrollContainerRef, isHorizontal, updateThumb]);

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

  const scrollToClientCoord = useCallback(
    (clientCoord: number) => {
      const container = scrollContainerRef.current;
      const miniMap = miniMapRef.current;
      if (!container || !miniMap) return;

      const rect = miniMap.getBoundingClientRect();

      if (isHorizontal) {
        const ratio = Math.min(1, Math.max(0, (clientCoord - rect.left) / rect.width));
        const target = ratio * container.scrollWidth - container.clientWidth / 2;
        container.scrollLeft = Math.min(container.scrollWidth - container.clientWidth, Math.max(0, target));
        return;
      }

      const ratio = Math.min(1, Math.max(0, (clientCoord - rect.top) / rect.height));
      const target = ratio * container.scrollHeight - container.clientHeight / 2;
      container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, Math.max(0, target));
    },
    [scrollContainerRef, isHorizontal],
  );

  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDragging.current = true;
      scrollToClientCoord(isHorizontal ? e.clientX : e.clientY);
    },
    [scrollToClientCoord, isHorizontal],
  );

  const onThumbMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      isThumbDragging.current = true;
      thumbDragStartCoord.current = isHorizontal ? e.clientX : e.clientY;
      const container = scrollContainerRef.current;
      thumbDragStartScroll.current = isHorizontal ? (container?.scrollLeft ?? 0) : (container?.scrollTop ?? 0);
    },
    [scrollContainerRef, isHorizontal],
  );

  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (isThumbDragging.current) {
        const container = scrollContainerRef.current;
        const miniMap = miniMapRef.current;
        if (!container || !miniMap) return;

        const rect = miniMap.getBoundingClientRect();
        const clientCoord = isHorizontal ? e.clientX : e.clientY;
        const rectSize = isHorizontal ? rect.width : rect.height;
        const scrollSize = isHorizontal ? container.scrollWidth : container.scrollHeight;
        const clientSize = isHorizontal ? container.clientWidth : container.clientHeight;
        const scrollDelta = ((clientCoord - thumbDragStartCoord.current) / rectSize) * scrollSize;

        const nextScroll = Math.min(scrollSize - clientSize, Math.max(0, thumbDragStartScroll.current + scrollDelta));
        if (isHorizontal) {
          container.scrollLeft = nextScroll;
        } else {
          container.scrollTop = nextScroll;
        }
        return;
      }

      if (!isDragging.current) return;
      scrollToClientCoord(isHorizontal ? e.clientX : e.clientY);
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
  }, [scrollToClientCoord, scrollContainerRef, isHorizontal]);

  const thumbStyle = isHorizontal
    ? { left: `${thumbOffset * 100}%`, width: `${thumbSize * 100}%` }
    : { top: `${thumbOffset * 100}%`, height: `${thumbSize * 100}%` };

  return (
    <div
      ref={miniMapRef}
      className={classNames(
        'absolute bg-layer-3 cursor-pointer z-10 select-none',
        isHorizontal
          ? 'left-0 right-0 bottom-0 h-4 border-t border-secondary'
          : 'right-0 top-0 bottom-0 w-4 border-l border-secondary',
      )}
      onMouseDown={onMouseDown}
      role="navigation"
    >
      {markers.map((marker, i) => (
        <div
          key={i}
          className={classNames(
            'absolute opacity-90 rounded-sm',
            isHorizontal ? 'top-0 bottom-0' : 'left-0 right-0',
            MARKER_BG[marker.status],
            MARKER_BORDER[marker.status],
          )}
          style={
            isHorizontal
              ? { left: `${marker.position * 100}%`, width: `${marker.height * 100}%` }
              : { top: `${marker.position * 100}%`, height: `${marker.height * 100}%` }
          }
        />
      ))}
      <div
        className={classNames(
          'absolute bg-inverted opacity-5 cursor-pointer',
          isHorizontal ? 'top-0 bottom-0 border-x border-secondary' : 'left-0 right-0 border-y border-secondary',
        )}
        onMouseDown={onThumbMouseDown}
        style={thumbStyle}
      />
    </div>
  );
};

export default DiffMiniMap;

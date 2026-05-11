'use client';

import { RefObject, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface Params {
  id: string;
  findColumn?: (name: string) => number;
  moveColumn?: (name: string, atIndex: number) => void;
}

interface Result {
  dragRef: RefObject<HTMLDivElement | null>;
  dropRef: RefObject<HTMLDivElement | null>;
  isDragging: boolean;
}

export const useColumnDragDrop = ({ id, findColumn, moveColumn }: Params): Result => {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const originalIndex = findColumn?.(id) as number;

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'column',
      item: { id, originalIndex },
      collect: (monitor) => {
        const item = monitor.getItem();
        return {
          isDragging: monitor.isDragging() && item?.id === id,
        };
      },
      end: (item, monitor) => {
        const { id: droppedId, originalIndex: from } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          moveColumn?.(droppedId, from);
        }
      },
    }),
    [id, originalIndex, moveColumn],
  );

  const [, drop] = useDrop(
    () => ({
      accept: 'column',
      hover: (item: { id: string }) => {
        if (item?.id !== id) {
          const idx = findColumn?.(id) as number;
          moveColumn?.(item.id, idx);
        }
      },
    }),
    [findColumn, moveColumn, id],
  );

  preview(drop(dropRef));
  drag(dragRef);

  return { dragRef, dropRef, isDragging };
};

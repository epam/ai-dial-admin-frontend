'use client';

import { IconGripVertical } from '@tabler/icons-react';
import { FC, useRef, type ReactNode } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  children: ReactNode;
  id: string;
  findItem?: (field: string) => number;
  moveItem?: (field: string, atIndex: number) => void;
}

const DraggableItem: FC<Props> = ({ children, id, findItem, moveItem }: Props) => {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const originalIndex = findItem?.(id) as number;

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'column',
      item: { id, originalIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          moveItem?.(droppedId, originalIndex);
        }
      },
    }),
    [id, originalIndex, moveItem],
  );
  const [, drop] = useDrop(
    () => ({
      accept: 'column',
      hover: (item: { id: string }) => {
        if (item?.id !== id) {
          const index = findItem?.(id) as number;
          moveItem?.(item.id, index);
        }
      },
    }),
    [findItem, moveItem],
  );

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <div ref={dropRef} className="flex items-center" style={{ opacity: isDragging ? 0 : 1 }}>
      <div ref={dragRef} className="mr-3 cursor-move text-secondary">
        <IconGripVertical {...BASE_ICON_PROPS} />
      </div>
      {children}
    </div>
  );
};

export default DraggableItem;

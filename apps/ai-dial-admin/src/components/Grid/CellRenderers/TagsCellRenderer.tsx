'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

interface Props {
  items: string[];
}

const GAP_WIDTH = 8;

const TagsCellRenderer: FC<Props> = ({ items }) => {
  if (!items) {
    return;
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const hiddenCountRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el) itemsRef.current[index] = el;
    },
    [],
  );

  const recalculateVisibleItems = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const hiddenCounterWidth = hiddenCountRef.current?.offsetWidth || 0;

    let totalWidth = 0;
    let fitCount = 0;

    for (let i = 0; i < items.length; i++) {
      const itemEl = itemsRef.current[i];
      if (!itemEl) continue;

      const itemWidth = itemEl.offsetWidth + GAP_WIDTH;
      if (totalWidth + itemWidth > containerWidth) break;
      totalWidth += itemWidth;
      fitCount++;
    }

    if (fitCount < items.length && fitCount > 0) {
      while (totalWidth + hiddenCounterWidth > containerWidth && fitCount > 0) {
        fitCount--;
        const removedWidth = itemsRef.current[fitCount]?.offsetWidth || 0;
        totalWidth -= removedWidth + GAP_WIDTH;
      }
    }

    setVisibleCount(fitCount);
  }, [items]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      recalculateVisibleItems();
    });

    const container = containerRef.current;
    if (container) observer.observe(container);

    recalculateVisibleItems();

    return () => observer.disconnect();
  }, [recalculateVisibleItems]);

  const itemClassName =
    'tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden';

  return (
    <div ref={containerRef} className="flex gap-2 overflow-hidden w-full">
      {items.slice(0, visibleCount).map((item, index) => (
        <div key={`shown-${item}-${index}`} ref={setItemRef(index)} className={itemClassName}>
          {item}
        </div>
      ))}

      {visibleCount < items.length && (
        <div ref={hiddenCountRef} className={itemClassName}>
          +{items.length - visibleCount}
        </div>
      )}

      <div className="absolute left-0 top-0 invisible h-0 overflow-hidden whitespace-nowrap">
        {items.map((item, index) => (
          <div
            key={`hidden-${item}-${index}`}
            ref={setItemRef(index)}
            className={classNames(itemClassName, 'inline-block')}
          >
            {item}
          </div>
        ))}
        <div ref={hiddenCountRef} className={classNames(itemClassName, 'inline-block')}>
          +{items.length}
        </div>
      </div>
    </div>
  );
};

export default TagsCellRenderer;

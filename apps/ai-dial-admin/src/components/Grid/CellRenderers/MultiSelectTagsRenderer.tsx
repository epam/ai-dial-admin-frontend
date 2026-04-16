'use client';

import { FC, useCallback, useEffect, useRef, useState, MouseEvent } from 'react';
import { DialTag, SelectOption } from '@epam/ai-dial-ui-kit';

interface Props {
  items: string[];
  options: SelectOption[];
  handleRemoveTag?: (event: MouseEvent<HTMLButtonElement>, val: string) => void;
}

const GAP_WIDTH = 4;

const MultiSelectTagsRenderer: FC<Props> = ({ items, options, handleRemoveTag }) => {
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

  return (
    <div ref={containerRef} className="flex gap-1 overflow-hidden w-full">
      {items.slice(0, visibleCount).map((item, index) => (
        <div key={`shown-${item}-${index}`} ref={setItemRef(index)}>
          <DialTag
            key={item}
            tag={options.find((o) => o.value === item)?.label ?? item}
            remove={(e) => handleRemoveTag?.(e, item)}
            className="max-w-full"
          />
        </div>
      ))}

      {visibleCount < items.length && (
        <div ref={hiddenCountRef}>
          <DialTag key={'tags-count'} tag={`+${items.length - visibleCount}`} className="max-w-full" />
        </div>
      )}

      <div className="absolute left-0 top-0 invisible h-0 overflow-hidden whitespace-nowrap">
        {items.map((item, index) => (
          <div key={`hidden-${item}-${index}`} ref={setItemRef(index)} className={'inline-block'}>
            <DialTag
              key={item}
              tag={options.find((o) => o.value === item)?.label ?? item}
              remove={(e) => handleRemoveTag?.(e, item)}
              className="max-w-full"
            />
          </div>
        ))}
        <div ref={hiddenCountRef} className={'inline-block'}>
          <DialTag key={'tags-count'} tag={`+${items.length}`} className="max-w-full" />
        </div>
      </div>
    </div>
  );
};

export default MultiSelectTagsRenderer;

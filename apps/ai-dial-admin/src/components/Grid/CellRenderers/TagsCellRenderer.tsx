'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  items: string[];
  tagClassName?: string;
}

const GAP_WIDTH = 8;

const TagsCellRenderer: FC<Props> = ({ items, tagClassName }) => {
  const tags = useMemo(() => items ?? [], [items]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const hiddenCountRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

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

    for (let i = 0; i < tags.length; i++) {
      const itemEl = itemsRef.current[i];
      if (!itemEl) continue;

      const itemWidth = itemEl.offsetWidth + GAP_WIDTH;
      if (totalWidth + itemWidth > containerWidth) break;
      totalWidth += itemWidth;
      fitCount++;
    }

    if (fitCount < tags.length && fitCount > 0) {
      while (totalWidth + hiddenCounterWidth > containerWidth && fitCount > 0) {
        fitCount--;
        const removedWidth = itemsRef.current[fitCount]?.offsetWidth || 0;
        totalWidth -= removedWidth + GAP_WIDTH;
      }
    }

    setVisibleCount(fitCount);
  }, [tags]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      recalculateVisibleItems();
    });

    const container = containerRef.current;
    if (container) observer.observe(container);

    recalculateVisibleItems();

    return () => observer.disconnect();
  }, [recalculateVisibleItems]);

  const itemClassName = mergeClasses(
    'tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden',
    tagClassName,
  );

  if (!items) {
    return null;
  }

  const hiddenItems = tags.slice(visibleCount);
  const hiddenItemsLabel = hiddenItems.join(', ');

  return (
    <div ref={containerRef} className="flex gap-2 overflow-hidden w-full">
      {tags.slice(0, visibleCount).map((item, index) => (
        <div key={`shown-${item}-${index}`} ref={setItemRef(index)} className={itemClassName}>
          {item}
        </div>
      ))}

      {!!hiddenItems.length && (
        <DialTooltip tooltip={hiddenItemsLabel}>
          {/* A button, not a div: the hidden names have to be reachable by keyboard, not hover alone. */}
          <button type="button" className={mergeClasses(itemClassName, 'cursor-default')}>
            +{hiddenItems.length}
            <span className="sr-only">{hiddenItemsLabel}</span>
          </button>
        </DialTooltip>
      )}

      <div className="absolute left-0 top-0 invisible h-0 overflow-hidden whitespace-nowrap">
        {tags.map((item, index) => (
          <div
            key={`hidden-${item}-${index}`}
            ref={setItemRef(index)}
            className={classNames(itemClassName, 'inline-block')}
          >
            {item}
          </div>
        ))}
        <div ref={hiddenCountRef} className={classNames(itemClassName, 'inline-block')}>
          +{tags.length}
        </div>
      </div>
    </div>
  );
};

export default TagsCellRenderer;

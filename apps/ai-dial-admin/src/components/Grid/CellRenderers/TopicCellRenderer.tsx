'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

interface Props {
  topics: string[];
}

const GAP_WIDTH = 8;

const TopicsCellRenderer: FC<Props> = ({ topics }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topicsRef = useRef<HTMLDivElement[]>([]);
  const hiddenCountRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(topics.length);

  const setTopicRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) topicsRef.current[index] = el;
  };

  const recalculateVisibleTopics = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const hiddenCounterWidth = hiddenCountRef.current?.offsetWidth || 0;

    let totalWidth = 0;
    let fitCount = 0;

    for (let i = 0; i < topics.length; i++) {
      const topicEl = topicsRef.current[i];
      if (!topicEl) continue;

      const topicWidth = topicEl.offsetWidth + GAP_WIDTH;
      if (totalWidth + topicWidth > containerWidth) break;
      totalWidth += topicWidth;
      fitCount++;
    }

    if (fitCount < topics.length && fitCount > 0) {
      while (totalWidth + hiddenCounterWidth > containerWidth && fitCount > 0) {
        fitCount--;
        const removedWidth = topicsRef.current[fitCount]?.offsetWidth || 0;
        totalWidth -= removedWidth + GAP_WIDTH;
      }
    }

    setVisibleCount(fitCount);
  }, [topics]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      recalculateVisibleTopics();
    });

    const container = containerRef.current;
    if (container) observer.observe(container);

    recalculateVisibleTopics();

    return () => observer.disconnect();
  }, [recalculateVisibleTopics]);

  const topicClass = 'tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px]';
  const hiddenClass = 'absolute left-0 top-0 invisible h-0 overflow-hidden whitespace-nowrap';

  return (
    <div ref={containerRef} className="flex gap-2 overflow-hidden w-full">
      {topics.slice(0, visibleCount).map((topic, index) => (
        <div key={topic} ref={setTopicRef(index)} className={classNames(topicClass)}>
          {topic}
        </div>
      ))}

      {visibleCount < topics.length && (
        <div ref={hiddenCountRef} className={classNames(topicClass)}>
          +{topics.length - visibleCount}
        </div>
      )}

      <div className={hiddenClass}>
        {topics.map((topic, index) => (
          <div key={`measure-${topic}`} ref={setTopicRef(index)} className={classNames(topicClass, 'inline-block')}>
            {topic}
          </div>
        ))}
        <div ref={hiddenCountRef} className={classNames(topicClass, 'inline-block')}>
          +{topics.length}
        </div>
      </div>
    </div>
  );
};

export default TopicsCellRenderer;

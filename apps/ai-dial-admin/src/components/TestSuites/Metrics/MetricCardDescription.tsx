'use client';

import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  lines?: number;
  children: ReactNode;
  className?: string;
}

/** Metric-card description clamp with Figma Show more control (tiny-semi + chevron). */
const MetricCardDescription: FC<Props> = ({ lines = 2, children, className }) => {
  const t = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      return;
    }

    const check = () => setIsOverflowing(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, lines]);

  return (
    <div className={className}>
      <div
        ref={contentRef}
        style={
          !isExpanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {children}
      </div>
      {(isOverflowing || isExpanded) && (
        <button
          type="button"
          className="flex w-fit items-center gap-1 tiny-semi text-accent-primary"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? t(ButtonsI18nKey.ShowLess) : t(ButtonsI18nKey.ShowMore)}
          {isExpanded ? (
            <IconChevronUp stroke={2} size={16} aria-hidden />
          ) : (
            <IconChevronDown stroke={2} size={16} aria-hidden />
          )}
        </button>
      )}
    </div>
  );
};

export default MetricCardDescription;

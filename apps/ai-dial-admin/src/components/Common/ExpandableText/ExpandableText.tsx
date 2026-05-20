'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { DialLinkButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  lines: number;
  children: ReactNode;
  className?: string;
}

const ExpandableText: FC<Props> = ({ lines, children, className }) => {
  const t = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

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
        <DialLinkButton
          onClick={() => setIsExpanded((prev) => !prev)}
          label={isExpanded ? t(ButtonsI18nKey.ShowLess) : t(ButtonsI18nKey.ShowMore)}
        />
      )}
    </div>
  );
};

export default ExpandableText;

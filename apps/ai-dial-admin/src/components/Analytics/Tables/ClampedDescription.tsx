'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialLinkButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  text: string;
  className?: string;
}

/**
 * A description held to one line, with the control on that same line rather than beneath it — so a short
 * description costs one line and a long one costs no more until it is opened.
 *
 * `Common/ExpandableText` clamps to a line count and puts its control on the next line, which spends a
 * second line on every description whether or not it needed one. That component serves several callers on
 * those terms; this one is the tables catalog's own shape.
 */
const ClampedDescription: FC<Props> = ({ text, className }) => {
  const t = useI18n();

  const ref = useRef<HTMLSpanElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Measured only while clamped: an opened description wraps, so its scroll width equals its client width
  // and re-measuring would withdraw the control that closes it again.
  useEffect(() => {
    const el = ref.current;
    if (!el || isExpanded) return;

    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, isExpanded]);

  return (
    <div className={classNames('flex min-w-0 gap-2', isExpanded ? 'flex-col items-start' : 'flex-row items-baseline')}>
      <span ref={ref} className={classNames('min-w-0', className, !isExpanded && 'truncate')}>
        {text}
      </span>
      {(isOverflowing || isExpanded) && (
        <DialLinkButton
          className="shrink-0"
          label={t(isExpanded ? ButtonsI18nKey.ShowLess : ButtonsI18nKey.ShowMore)}
          onClick={() => setIsExpanded((prev) => !prev)}
        />
      )}
    </div>
  );
};

export default ClampedDescription;

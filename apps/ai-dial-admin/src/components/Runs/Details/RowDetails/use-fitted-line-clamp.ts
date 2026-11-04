'use client';

import { useLayoutEffect, useState } from 'react';

import { getFittingLineCount } from '@/src/components/Runs/Details/RowDetails/utils/get-fitting-line-count';

/** `dial-small-text`, used when the browser reports no usable line height (`normal`). */
const FALLBACK_LINE_HEIGHT_PX = 20;

const readLineHeight = (container: HTMLElement): number => {
  const text = container.firstElementChild ?? container;
  const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);
  return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : FALLBACK_LINE_HEIGHT_PX;
};

/**
 * The number of text lines that fit the height of a container, kept current as the container resizes. A fixed
 * `line-clamp-N` class cannot follow a height that depends on the panel, so the count is applied inline.
 * Attach `containerRef` to the element whose height is the space the text may use; its first child is the text.
 * `lineClamp` is `undefined` until the container has been measured.
 */
export const useFittedLineClamp = <T extends HTMLElement>() => {
  const [container, setContainer] = useState<T | null>(null);
  const [lineClamp, setLineClamp] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!container) return;

    const measure = () => setLineClamp(getFittingLineCount(container.clientHeight, readLineHeight(container)));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  return { containerRef: setContainer, lineClamp };
};

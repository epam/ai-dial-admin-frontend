'use client';

import { FC, useEffect, useRef } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import ClampedDescription from '@/src/components/Analytics/Tables/ClampedDescription';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

/**
 * A description is read rather than scanned, so it is clamped to its line with a Show more control beside
 * it instead of being ellipsised into a tooltip.
 *
 * The grid sizes a row before its cell renders and does not watch it afterwards, so opening the clamp
 * would leave the text clipped by a row that never grew. The wrapper watches its own height rather than
 * ExpandableText reporting the toggle: that component serves several callers and none of the others needs
 * to announce when it opened.
 */
export const DescriptionCellRenderer: FC<ICellRendererParams<AnalyticsTableColumn>> = ({ data, api }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(() => api?.resetRowHeights());
    observer.observe(el);
    return () => observer.disconnect();
  }, [api]);

  if (!data?.description) return null;

  return (
    <div ref={ref} className="py-2">
      <ClampedDescription text={data.description} />
    </div>
  );
};

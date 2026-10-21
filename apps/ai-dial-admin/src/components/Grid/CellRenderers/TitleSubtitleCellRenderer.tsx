'use client';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

export interface TitleSubtitleCellRendererParams<TData = unknown, TValue = unknown> extends ICellRendererParams<
  TData,
  TValue
> {
  /** Second line — resolved from the row, so a column can pair its own value with any other field. */
  getSubtitle?: (data: TData | undefined) => string | undefined;
}

/**
 * Two lines in one cell: the column value on top, a secondary line below. Each line truncates
 * independently at the cell's rendered width and keeps its full value reachable via the tooltip.
 * Both lines fit inside the standard row height, so no `rowHeight` override is needed.
 */
const TitleSubtitleCellRenderer = <TData,>({ value, data, getSubtitle }: TitleSubtitleCellRendererParams<TData>) => {
  const title = value == null ? '' : String(value);
  const subtitle = getSubtitle?.(data) ?? '';

  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className="flex size-full min-w-0 flex-col justify-center">
      {!!title && <EllipsisTooltip className="dial-small-text text-primary flex-none" text={title} />}
      {!!subtitle && <EllipsisTooltip className="dial-tiny-text text-secondary flex-none" text={subtitle} />}
    </div>
  );
};

export default TitleSubtitleCellRenderer;

'use client';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import EntityLinkCell from '@/src/components/Grid/CellRenderers/EntityLinkCell';
import { EntityHrefGetter } from '@/src/components/Grid/CellRenderers/models';

export interface TitleSubtitleCellRendererParams<TData = unknown, TValue = unknown> extends ICellRendererParams<
  TData,
  TValue
> {
  /** Second line — resolved from the row, so a column can pair its own value with any other field. */
  getSubtitle?: (data: TData | undefined) => string | undefined;
  getHref?: EntityHrefGetter<TData>;
}

/**
 * Two lines in one cell: the column value on top, a secondary line below. Each line truncates
 * independently at the cell's rendered width and keeps its full value reachable via the tooltip.
 * Both lines fit inside the standard row height, so no `rowHeight` override is needed.
 */
const TitleSubtitleCellRenderer = <TData,>({
  value,
  data,
  getSubtitle,
  getHref,
}: TitleSubtitleCellRendererParams<TData>) => {
  const title = value == null ? '' : String(value);
  const subtitle = getSubtitle?.(data) ?? '';
  const href = title ? getHref?.(data) : undefined;

  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className="flex size-full min-w-0 flex-col justify-center">
      {!!title &&
        (href ? (
          <EntityLinkCell href={href} className="flex-none">
            <EllipsisTooltip className="dial-small-text" text={title} />
          </EntityLinkCell>
        ) : (
          <EllipsisTooltip className="dial-small-text text-primary flex-none" text={title} />
        ))}
      {!!subtitle && <EllipsisTooltip className="dial-tiny-text text-secondary flex-none" text={subtitle} />}
    </div>
  );
};

export default TitleSubtitleCellRenderer;

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import EntityLinkCell from '@/src/components/Grid/CellRenderers/EntityLinkCell';
import { LinkCellRendererParams } from '@/src/components/Grid/CellRenderers/models';

const LinkCellRenderer = <TData,>({ value, valueFormatted, data, getHref }: LinkCellRendererParams<TData>) => {
  const text = valueFormatted ?? (value == null ? '' : String(value));
  const href = text ? getHref?.(data) : undefined;

  if (!href) {
    return <EllipsisTooltip className="dial-small-text text-primary" text={text} />;
  }

  return (
    <EntityLinkCell href={href}>
      <EllipsisTooltip className="dial-small-text" text={text} />
    </EntityLinkCell>
  );
};

export default LinkCellRenderer;

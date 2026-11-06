import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { Fragment } from 'react';

import EntityLinkCell from '@/src/components/Grid/CellRenderers/EntityLinkCell';
import { MultiLinkCellRendererParams } from '@/src/components/Grid/CellRenderers/models';

const MultiLinkCellRenderer = <TData,>({
  data,
  value,
  valueFormatted,
  getLinks,
  isNewTab,
}: MultiLinkCellRendererParams<TData>) => {
  const links = getLinks?.(data) ?? [];

  if (!links.length) {
    const text = valueFormatted ?? (value == null ? '' : String(value));
    return <EllipsisTooltip className="dial-small-text text-primary" text={text} />;
  }

  return (
    <span className="flex min-w-0 items-center overflow-hidden whitespace-nowrap dial-small-text text-primary">
      {links.map(({ label, href }, index) => (
        <Fragment key={`${label}-${index}`}>
          {index > 0 && <span className="shrink-0 pr-1">,</span>}
          {href ? (
            <EntityLinkCell href={href} isNewTab={isNewTab} className="truncate">
              {label}
            </EntityLinkCell>
          ) : (
            <span className="min-w-0 truncate">{label}</span>
          )}
        </Fragment>
      ))}
    </span>
  );
};

export default MultiLinkCellRenderer;

import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { FallbackIcon } from '@/src/components/Header/User/UserMenu/UserIcon';

const DisplayNameCellRenderer = (params: ICellRendererParams) => {
  const displayName = (params.data?.displayName as string) ?? (params.value as string);
  const id = params.data?.name as string | undefined;
  const showId = Boolean(id) && id !== displayName;

  return (
    <div className="flex h-full items-center gap-2 overflow-hidden">
      <FallbackIcon name={displayName} seed={id ?? displayName} />
      <div className="flex flex-col justify-center overflow-hidden">
        <DialEllipsisTooltip className="small text-primary" text={displayName ?? ''} />
        {showId && <DialEllipsisTooltip className="tiny text-secondary" text={id ?? ''} />}
      </div>
    </div>
  );
};

export default DisplayNameCellRenderer;

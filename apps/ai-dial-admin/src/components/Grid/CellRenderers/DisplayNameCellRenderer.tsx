import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import FilledIcon from '@/src/components/Common/IconFile/FilledIcon';
import { DisplayNameCellRendererParams } from '@/src/components/Grid/CellRenderers/models';
import { FallbackIcon } from '@/src/components/Header/User/UserMenu/UserIcon';

const noop = () => undefined;

const DisplayNameCellRenderer = (params: DisplayNameCellRendererParams) => {
  const displayName = params.data?.displayName || (params.data?.name as string) || (params.value as string);
  const id = params.data?.name as string | undefined;
  const showId = Boolean(id) && id !== displayName;
  const iconUrl = params.data?.iconUrl as string | undefined;
  const TypeIcon = params.typeIcon;

  const renderIcon = () => {
    if (TypeIcon) {
      return (
        <span className="flex size-[28px] shrink-0 items-center justify-center">
          <TypeIcon aria-hidden />
        </span>
      );
    }
    if (iconUrl) {
      return <FilledIcon fileUrl={iconUrl} onChange={noop} disabled size={28} />;
    }
    return <FallbackIcon name={displayName} seed={id ?? displayName} />;
  };

  return (
    <div className="flex h-full items-center gap-2 overflow-hidden">
      {renderIcon()}
      <div className="flex flex-col justify-center overflow-hidden">
        <DialEllipsisTooltip className="small text-primary" text={displayName ?? ''} />
        {showId && <DialEllipsisTooltip className="tiny text-secondary" text={id ?? ''} />}
      </div>
    </div>
  );
};

export default DisplayNameCellRenderer;

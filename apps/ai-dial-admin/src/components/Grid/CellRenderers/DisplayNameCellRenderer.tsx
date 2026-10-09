import { Avatar, AvatarShape, DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import FilledIcon from '@/src/components/Common/IconFile/FilledIcon';
import { DisplayNameCellRendererParams } from '@/src/components/Grid/CellRenderers/models';

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
      return <FilledIcon fileUrl={iconUrl} onChange={noop} disabled size={40} />;
    }
    return <Avatar name={displayName ?? ''} shape={AvatarShape.Square} size={40} textClassName="dial-h3-text" />;
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

'use client';

import { FC } from 'react';

import { DialItemType, EllipsisTooltip, FileIcon } from '@epam/ai-dial-ui-kit';

import { LARGE_ICON_SIZE } from '@/src/components/FoldersStorage/constants';
import ChangedEntityButtons from '../EntityHeaderControls/Buttons/ChangedEntityButtons';

interface Props {
  isChanged: boolean;
  isSaveDisable?: boolean;
  title: string;
  onSave?: () => void;
  onDiscard?: () => void;
}

const FolderInfoHeader: FC<Props> = ({ isChanged, isSaveDisable, title, onSave, onDiscard }) => {
  return (
    <div className="flex justify-between items-center w-full gap-5">
      <div className="flex flex-1 min-w-0 items-center gap-3">
        <FileIcon type={DialItemType.Folder} name={title} size={LARGE_ICON_SIZE} className="shrink-0" decorative />
        <h2 className="min-w-0">
          <EllipsisTooltip contentClassName="truncate" text={title} />
        </h2>
      </div>
      {isChanged && <ChangedEntityButtons onDiscard={onDiscard} onSave={onSave} disableSave={isSaveDisable} />}
    </div>
  );
};

export default FolderInfoHeader;

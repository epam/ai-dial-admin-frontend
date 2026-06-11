'use client';

import { FC } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import ChangedEntityButtons from '../EntityHeaderControls/Buttons/ChangedEntityButtons';

interface Props {
  isChanged: boolean;
  isSaveDisable: boolean;
  title: string;
  onSave: () => void;
  onDiscard: () => void;
}

const FolderInfoHeader: FC<Props> = ({ isChanged, isSaveDisable, title, onSave, onDiscard }) => {
  return (
    <div className="flex justify-between items-center w-full gap-5">
      <h2 className="flex-1 min-w-0">
        <DialEllipsisTooltip contentClassName="truncate" text={title} />
      </h2>
      {isChanged && <ChangedEntityButtons onDiscard={onDiscard} onSave={onSave} disableSave={isSaveDisable} />}
    </div>
  );
};

export default FolderInfoHeader;

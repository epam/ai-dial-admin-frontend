'use client';

import { FC } from 'react';

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
    <div className="flex justify-between items-center">
      <h2 className="flex flex-1 w-full">{title}</h2>
      {isChanged && <ChangedEntityButtons onDiscard={onDiscard} onSave={onSave} disableSave={isSaveDisable} />}
    </div>
  );
};

export default FolderInfoHeader;

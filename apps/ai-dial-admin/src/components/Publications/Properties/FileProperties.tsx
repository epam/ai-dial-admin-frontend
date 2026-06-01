import { Dispatch, FC, SetStateAction } from 'react';

import FilesDetails from '@/src/components/Publications/Assets/Files/FilesDetails';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { FilePublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: FilePublication;
  onChange?: (publication: FilePublication) => void;
  addedFiles?: File[];
  setAddedFiles: Dispatch<SetStateAction<File[]>>;
  disabled?: boolean;
}

const FileProperties: FC<Props> = ({ publication, onChange, addedFiles, setAddedFiles, disabled }) => {
  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="size-full flex flex-col gap-y-8">
        <BaseProperties
          publication={publication}
          onChange={onChange}
          getContext={useFileFolder}
          shouldAbleToCreateNewFolder={false}
        />
        <FilesDetails
          publication={publication}
          onChange={onChange}
          addedFiles={addedFiles}
          setAddedFiles={setAddedFiles}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default FileProperties;

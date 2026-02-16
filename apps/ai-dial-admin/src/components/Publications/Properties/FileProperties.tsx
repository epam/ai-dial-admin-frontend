import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import FilesList from '@/src/components/Publications/Assets/Files/FilesList';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useI18n } from '@/src/locales/client';
import { FilePublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: FilePublication;
  onChange?: (publication: FilePublication) => void;
}

const FileProperties: FC<Props> = ({ publication, onChange }) => {
  const t = useI18n();

  const handleFilesChange = (files: FilePublication['files']) => {
    const updatedPublication = { ...publication, files };
    onChange?.(updatedPublication);
  };

  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full h-full flex flex-col gap-y-8">
        <BaseProperties publication={publication} onChange={onChange} getContext={useFileFolder} />
        <div className="flex flex-col flex-1 min-h-0">
          <h3 className="text-primary mb-4">
            {t(PublicationsI18nKey.FilesListTitle)}: {publication.files?.length || 0}
          </h3>

          <div className="flex-1 min-h-0">
            {publication.files && publication.files.length > 0 ? (
              <FilesList files={publication.files} action={publication.action} onChange={handleFilesChange} />
            ) : (
              <DialNoDataContent title={t(EntitiesI18nKey.NoFiles)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileProperties;

import { DialNoDataContent, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo } from 'react';

import FilePath from '@/src/components/Common/FilePath/FilePath';
import FilesList from '@/src/components/Publications/Assets/Files/FilesList';
import { ROOT_FOLDER } from '@/src/constants/file';
import {
  BasicI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  PublicationsI18nKey,
} from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useI18n } from '@/src/locales/client';
import { FilePublication } from '@/src/models/dial/publications';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  publication: FilePublication;
  onChange?: (publication: FilePublication) => void;
}

const FilesProperties: FC<Props> = ({ publication, onChange }) => {
  const t = useI18n();
  const containerClassName = useMemo(() => getControlClassName(false), []);
  const { fetchFiles, files } = useFileFolder();

  const handleFilesChange = (files: FilePublication['files']) => {
    const updatedPublication = { ...publication, files };
    onChange?.(updatedPublication);
  };

  useEffect(() => {
    if (!files.length) {
      fetchFiles(`${ROOT_FOLDER}/`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <DialTextInputField
          fieldTitle={t(EntityFieldsI18nKey.displayAuthor)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayAuthor)}
          elementId="author"
          value={publication.displayAuthor || ''}
          onChange={(displayAuthor) => onChange?.({ ...publication, displayAuthor })}
          containerClassName={containerClassName}
        />
        <FilePath
          value={publication.folderId}
          label={t(EntitiesI18nKey.FolderStorage)}
          modalTitle={t(BasicI18nKey.MoveToFolder)}
          placeholder={t(EntityPlaceholdersI18nKey.Path)}
          onChange={(folderId) => onChange?.({ ...publication, folderId })}
          context={useFileFolder}
        />
        <div className="flex flex-col ">
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

export default FilesProperties;

import { ChangeEvent, Dispatch, FC, SetStateAction, useCallback, useRef } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import FilesList from '@/src/components/Publications/Assets/Files/FilesList';
import { ButtonsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { FilePublication } from '@/src/models/dial/publications';

interface Props {
  publication: FilePublication;
  onChange?: (publication: FilePublication) => void;
  addedFiles?: File[];
  setAddedFiles: Dispatch<SetStateAction<File[]>>;
}

const FilesDetails: FC<Props> = ({ publication, onChange, addedFiles, setAddedFiles }) => {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (files: FilePublication['files']) => {
    const updatedPublication = { ...publication, files };
    onChange?.(updatedPublication);
  };

  const onAddClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && setAddedFiles) {
        setAddedFiles((prev) => [...(prev || []), selectedFile]);
      }
      e.target.value = '';
    },
    [setAddedFiles],
  );

  const onRemoveAdded = useCallback(
    (index: number) => {
      setAddedFiles?.((prev) => {
        const newFiles = [...(prev || [])];
        newFiles.splice(index, 1);
        return newFiles;
      });
    },
    [setAddedFiles],
  );

  return (
    <div className="flex flex-col gap-y-2 flex-1 min-h-0">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-primary mb-4">
          {t(PublicationsI18nKey.FilesListTitle)}: {(publication.files?.length || 0) + (addedFiles?.length || 0)}
        </h3>
        {addedFiles && (
          <>
            <DialGhostButton
              onClick={onAddClick}
              label={t(ButtonsI18nKey.Add)}
              className="w-fit"
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            />
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
          </>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <FilesList
          files={publication.files || []}
          action={publication.action}
          onChange={handleFilesChange}
          addedFiles={addedFiles}
          onRemoveAdded={onRemoveAdded}
        />
      </div>
    </div>
  );
};

export default FilesDetails;

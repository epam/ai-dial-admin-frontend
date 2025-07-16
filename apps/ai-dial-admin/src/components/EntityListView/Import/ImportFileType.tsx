import { FC } from 'react';

import { IconFileTypeZip } from '@tabler/icons-react';

import Json from '@/public/images/icons/file/json.svg';
import LoadFileAreaField from '@/src/components/Common/LoadFileArea/LoadFileAreaField';
import RadioButton from '@/src/components/Common/RadioButton/RadioButton';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { RadioButtonModel } from '@/src/models/radio-button';
import { ImportFileType } from '@/src/types/import';
import { getIcon } from '@/src/utils/files/icon';

interface Props {
  files: File[];
  changeFile: (files: File[]) => void;
  fileType: string;
  fileTypes: RadioButtonModel[];
  changeFileType: (type: string) => void;
  isInvalid?: (file: File) => boolean;
  maxFilesCount?: number;
}

const ImportFileTypeSelector: FC<Props> = ({
  files,
  changeFile,
  fileTypes,
  fileType,
  changeFileType,
  isInvalid,
  maxFilesCount,
}) => {
  const t = useI18n();

  const getFileIcon = (name: string) => {
    return getIcon(getNameExtensionFromFile(name).extension);
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="pt-6 pb-4">{t(ImportI18nKey.FileType)}</h3>
      {fileTypes.map((type) => (
        <RadioButton
          key={type.id}
          inputId={type.id}
          title={type.name}
          description={type.description}
          checked={type.id === fileType}
          onChange={() => changeFileType(type.id)}
        />
      ))}
      <div className="mt-6 flex-1 min-h-0">
        {fileType === ImportFileType.ARCHIVE && (
          <LoadFileAreaField
            elementId="importArchive"
            files={files?.[0] ? [files[0]] : []}
            fieldTitle={t(ImportI18nKey.File)}
            emptyTitle={t(ImportI18nKey.DropAnyFile)}
            maxFilesCount={1}
            isMultiple={false}
            iconBeforeInput={<IconFileTypeZip width={18} height={18} className="text-secondary" />}
            fileFormatError={t(ImportI18nKey.ImportArchiveFileFormatError)}
            fileCountError={t(ImportI18nKey.ImportArchiveDescription)}
            acceptTypes="application/zip, .zip, application/x-zip-compressed"
            onChangeFile={changeFile}
          />
        )}
        {fileType === ImportFileType.JSON && (
          <LoadFileAreaField
            elementId="importJSON"
            fieldTitle={t(ImportI18nKey.Files)}
            emptyTitle={t(ImportI18nKey.DropFiles)}
            files={files}
            iconBeforeInput={
              <i className="text-secondary">
                <Json />
              </i>
            }
            acceptTypes="application/json"
            fileFormatError={t(ImportI18nKey.ImportJsonFileFormatError)}
            isInvalid={isInvalid}
            errorText={t(ImportI18nKey.ImportPromptError)}
            onChangeFile={changeFile}
            maxFilesCount={maxFilesCount}
          />
        )}
        {fileType === ImportFileType.FILES && (
          <LoadFileAreaField
            elementId="importFiles"
            fieldTitle={t(ImportI18nKey.ImportFiles)}
            emptyTitle={t(ImportI18nKey.DropAnyFile)}
            files={files}
            acceptTypes="/"
            fileFormatError={t(ImportI18nKey.ImportFileErrorType)}
            onChangeFile={changeFile}
            isInvalid={isInvalid}
            dynamicIcon={getFileIcon}
            errorText={t(ImportI18nKey.ImportFileError)}
            maxFilesCount={maxFilesCount}
          />
        )}
      </div>
    </div>
  );
};

export default ImportFileTypeSelector;

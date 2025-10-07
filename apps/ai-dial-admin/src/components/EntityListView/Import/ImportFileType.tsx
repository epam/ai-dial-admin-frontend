import { Dispatch, FC, SetStateAction, useMemo } from 'react';

import { IconFileTypeZip } from '@tabler/icons-react';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import Json from '@/public/images/icons/file/json.svg';
import Field from '@/src/components/Common/Field/Field';
import LoadFileAreaField from '@/src/components/Common/LoadFileArea/LoadFileAreaField';
import RadioButton from '@/src/components/Common/RadioButton/RadioButton';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { RadioButtonModel } from '@/src/models/radio-button';
import { ImportFileType } from '@/src/types/import';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { getIcon } from '@/src/utils/files/icon';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  files: File[];
  changeFile: (files: File[]) => void;
  fileType: string;
  fileTypes: RadioButtonModel[];
  changeFileType: (type: string) => void;
  isInvalid?: (file: File) => boolean;
  maxFilesCount?: number;
  ignorePaths?: boolean;
  setIgnorePaths?: Dispatch<SetStateAction<boolean>>;
  route?: ApplicationRoute;
}

const ImportFileTypeSelector: FC<Props> = ({
  files,
  changeFile,
  fileTypes,
  fileType,
  changeFileType,
  isInvalid,
  maxFilesCount,
  ignorePaths,
  setIgnorePaths,
  route,
}) => {
  const t = useI18n();

  const ignorePathsTitle = useMemo(() => {
    if (route === ApplicationRoute.Prompts) {
      return t(ImportI18nKey.PathsPrompt);
    }
    if (route === ApplicationRoute.Files) {
      return t(ImportI18nKey.PathsFile);
    }
    return '';
  }, [t, route]);

  const getFileIcon = (name: string) => {
    return getIcon(getNameExtensionFromFile(name).extension);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex flex-col">
          <Field fieldTitle={t(ImportI18nKey.FileType)} />
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
        </div>
        {route === ApplicationRoute.Prompts && (
          <div className="flex flex-col">
            <Field fieldTitle={ignorePathsTitle} />
            <DialSwitch
              isOn={ignorePaths}
              title={t(ImportI18nKey.PathsIgnore)}
              switchId="ignorePaths"
              onChange={setIgnorePaths}
            />
          </div>
        )}
      </div>
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
            fileFormatError={t(ImportI18nKey.ArchiveFileFormatError)}
            fileCountError={t(ImportI18nKey.ArchiveDescription)}
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
            fileFormatError={t(ImportI18nKey.JsonFileFormatError)}
            isInvalid={isInvalid}
            errorText={t(ImportI18nKey.PromptError)}
            onChangeFile={changeFile}
            maxFilesCount={maxFilesCount}
          />
        )}
        {fileType === ImportFileType.FILES && (
          <LoadFileAreaField
            elementId="importFiles"
            fieldTitle={t(ImportI18nKey.Files)}
            emptyTitle={t(ImportI18nKey.DropAnyFile)}
            files={files}
            acceptTypes="/"
            fileFormatError={t(ImportI18nKey.FileErrorType)}
            onChangeFile={changeFile}
            isInvalid={isInvalid}
            dynamicIcon={getFileIcon}
            errorText={t(ImportI18nKey.FileError)}
            maxFilesCount={maxFilesCount}
          />
        )}
      </div>
    </div>
  );
};

export default ImportFileTypeSelector;

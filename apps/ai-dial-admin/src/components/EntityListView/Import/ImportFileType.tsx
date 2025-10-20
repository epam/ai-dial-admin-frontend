import { Dispatch, FC, SetStateAction, useMemo } from 'react';

import { IconFileTypeZip } from '@tabler/icons-react';
import {
  DialRadioGroup,
  DialSwitch,
  RadioGroupOrientation,
  RadioButtonWithContent,
  DialLoadFileAreaField,
  DialIcon,
} from '@epam/ai-dial-ui-kit';

import Json from '@/public/images/icons/file/json.svg';
import Field from '@/src/components/Common/Field/Field';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ImportFileType } from '@/src/types/import';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { getIcon } from '@/src/utils/files/icon';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  files: File[];
  changeFile: (files: File[]) => void;
  fileType: string;
  fileTypes: RadioButtonWithContent[];
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
        <DialRadioGroup
          fieldTitle={t(ImportI18nKey.FileType)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={fileTypes}
          activeRadioButton={fileType}
          elementId="file-type"
          onChange={changeFileType}
        />

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
          <DialLoadFileAreaField
            elementId="importArchive"
            files={files?.[0] ? [files[0]] : []}
            fieldTitle={t(ImportI18nKey.File)}
            emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
            emptyTextSecondLine={t(BasicI18nKey.Or)}
            emptyButtonLabel={t(ButtonsI18nKey.Browse)}
            maxFilesCount={1}
            multiple={false}
            iconBeforeInput={<IconFileTypeZip width={18} height={18} className="text-secondary" />}
            fileFormatError={t(ImportI18nKey.ArchiveFileFormatError)}
            fileCountError={t(ImportI18nKey.ArchiveDescription)}
            acceptTypes="application/zip, .zip, application/x-zip-compressed"
            onChange={changeFile}
          />
        )}
        {fileType === ImportFileType.JSON && (
          <DialLoadFileAreaField
            elementId="importJSON"
            fieldTitle={t(ImportI18nKey.Files)}
            emptyTextFirstLine={t(ImportI18nKey.DropFiles)}
            emptyTextSecondLine={t(BasicI18nKey.Or)}
            emptyButtonLabel={t(ButtonsI18nKey.Browse)}
            files={files}
            iconBeforeInput={<DialIcon icon={<Json />} className="text-secondary" />}
            acceptTypes="application/json"
            fileFormatError={t(ImportI18nKey.JsonFileFormatError)}
            isInvalid={isInvalid}
            errorText={t(ImportI18nKey.PromptError)}
            onChange={changeFile}
            maxFilesCount={maxFilesCount}
          />
        )}
        {fileType === ImportFileType.FILES && (
          <DialLoadFileAreaField
            elementId="importFiles"
            fieldTitle={t(ImportI18nKey.Files)}
            emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
            emptyTextSecondLine={t(BasicI18nKey.Or)}
            emptyButtonLabel={t(ButtonsI18nKey.Browse)}
            files={files}
            acceptTypes="/"
            fileFormatError={t(ImportI18nKey.FileErrorType)}
            onChange={changeFile}
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

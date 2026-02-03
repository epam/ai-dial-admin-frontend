import { Dispatch, FC, SetStateAction, useMemo } from 'react';

import {
  DialRadioGroup,
  DialSwitch,
  RadioGroupOrientation,
  RadioButtonWithContent,
  DialLoadFileAreaField,
  DialFileIcon,
} from '@epam/ai-dial-ui-kit';

import Field from '@/src/components/Common/Field/Field';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ImportFileType } from '@/src/types/import';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetView } from '@/src/utils/is-asset-view';
import { getIgnorePathTitles } from '@/src/utils/import/get-ignore-path-title';
import { APPLICATION_ZIP_TYPES_STR } from '@/src/constants/request-headers';

interface Props {
  files: File[];
  route?: ApplicationRoute;
  fileType: string;
  fileTypes: RadioButtonWithContent[];
  maxFilesCount?: number;
  ignorePaths?: boolean;
  setIgnorePaths?: Dispatch<SetStateAction<boolean>>;
  onChangeFile: (files: File[]) => void;
  onChangeFileType: (type: string) => void;
  isInvalid?: (file: File) => boolean;
}

const ImportFileTypeSelector: FC<Props> = ({
  files,
  onChangeFile,
  fileTypes,
  fileType,
  onChangeFileType,
  isInvalid,
  maxFilesCount,
  ignorePaths,
  setIgnorePaths,
  route,
}) => {
  const t = useI18n() as (key: string) => string;

  const ignorePathsTitle = useMemo(() => {
    return route ? getIgnorePathTitles(route, t) : '';
  }, [t, route]);

  const getFileIcon = (name: string) => {
    return <DialFileIcon extension={getNameExtensionFromFile(name).extension} />;
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
          onChange={onChangeFileType}
        />

        {isAssetView(route) && (
          <div className="flex flex-col">
            <Field fieldTitle={ignorePathsTitle} />
            <DialSwitch
              isOn={ignorePaths}
              label={t(ImportI18nKey.PathsIgnore)}
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
            iconBeforeInput={<DialFileIcon extension="zip" className="text-secondary" />}
            fileFormatError={t(ImportI18nKey.ArchiveFileFormatError)}
            fileCountError={t(ImportI18nKey.ArchiveDescription)}
            acceptTypes={APPLICATION_ZIP_TYPES_STR}
            onChange={onChangeFile}
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
            iconBeforeInput={<DialFileIcon extension="json" className="text-secondary" />}
            acceptTypes="application/json"
            fileFormatError={t(ImportI18nKey.JsonFileFormatError)}
            isInvalid={isInvalid}
            errorText={t(ImportI18nKey.PromptError)}
            onChange={onChangeFile}
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
            onChange={onChangeFile}
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

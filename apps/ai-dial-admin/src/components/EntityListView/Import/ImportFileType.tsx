import { Dispatch, FC, SetStateAction, useMemo } from 'react';

import {
  DialFileIcon,
  DialLabel,
  DialLoadFileAreaField,
  DialRadioGroup,
  DialSwitch,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { APPLICATION_ZIP_TYPES_STR } from '@/src/constants/request-headers';
import { useI18n } from '@/src/locales/client';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { getIgnorePathTitles } from '@/src/utils/import/get-ignore-path-title';
import { getImportSizeLimits } from '@/src/utils/import/get-import-size-limits';
import { isAssetView } from '@/src/utils/is-view';

interface Props {
  files: File[];
  route?: ApplicationRoute;
  fileType: string;
  fileTypes: RadioButtonWithContent[];
  maxFilesCount?: number;
  totalFileSizeExceeded?: boolean;
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
  const t = useI18n();
  const { maxFileSizeMb, maxMultiFilesSizeMb } = getImportSizeLimits(route);

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
          <div className="flex flex-col gap-y-1">
            <DialLabel label={ignorePathsTitle} htmlFor="ignorePaths" />
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
            fileSizeError={t(ImportI18nKey.ArchiveSizeErrorDescription, { size: maxFileSizeMb })}
            maxFileSize={maxFileSizeMb}
            deleteAllButtonLabel={t(ButtonsI18nKey.DeleteAll)}
            addButtonLabel={t(ButtonsI18nKey.Add)}
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
            maxFileSize={maxFileSizeMb}
            maxMultiFilesSize={maxMultiFilesSizeMb}
            fileSizeError={t(ImportI18nKey.FileSizeErrorDescription, { size: maxFileSizeMb })}
            multiFilesSizeError={t(ImportI18nKey.TotalFileSizeErrorDescription, { size: maxMultiFilesSizeMb })}
            onChange={onChangeFile}
            maxFilesCount={maxFilesCount}
            deleteAllButtonLabel={t(ButtonsI18nKey.DeleteAll)}
            addButtonLabel={t(ButtonsI18nKey.Add)}
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
            maxFilesCount={maxFilesCount}
            multiFilesSizeError={t(ImportI18nKey.TotalFileSizeErrorDescription, { size: maxMultiFilesSizeMb })}
            maxMultiFilesSize={maxMultiFilesSizeMb}
            deleteAllButtonLabel={t(ButtonsI18nKey.DeleteAll)}
            addButtonLabel={t(ButtonsI18nKey.Add)}
          />
        )}
      </div>
    </div>
  );
};

export default ImportFileTypeSelector;

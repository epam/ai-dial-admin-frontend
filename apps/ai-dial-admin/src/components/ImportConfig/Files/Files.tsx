'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { IconArrowNarrowRight } from '@tabler/icons-react';
import {
  DialPrimaryButton,
  RadioButtonWithContent,
  DialRadioGroup,
  RadioGroupOrientation,
  DialLoadFileAreaField,
  DialFileIcon,
} from '@epam/ai-dial-ui-kit';

import { isLargeFile } from '@/src/components/EntityListView/Import/utils';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { ARCHIVE_IMPORT_TYPE, DIAL_JSON_IMPORT_TYPE, IMPORT_RESOLUTIONS } from '@/src/constants/import';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';

const IMPORT_FILE_TYPES = (t: (str: string) => string): RadioButtonWithContent[] => [
  ARCHIVE_IMPORT_TYPE(t),
  DIAL_JSON_IMPORT_TYPE(t),
];

interface Props {
  files: File[];
  fileType: ImportFileType;
  isFilesValid?: boolean;
  onChangeFiles: (files: File[]) => void;
  onChangeFileType: (fileType: string) => void;
  onChangeImportBody: (body: FormData) => void;
  onNextStep: () => void;
}
const Files: FC<Props> = ({
  files,
  fileType,
  isFilesValid,
  onChangeFiles,
  onNextStep,
  onChangeImportBody,
  onChangeFileType,
}) => {
  const t = useI18n();

  const [activeResolution, setActiveResolution] = useState(ConflictResolutionPolicy.OVERRIDE);

  useEffect(() => {
    const body = new FormData();

    files.forEach((file) => {
      body.append('file', file);
    });
    body.append('resolutionPolicy', activeResolution.toUpperCase());
    onChangeImportBody(body);
  }, [files, activeResolution, onChangeImportBody]);

  const onChangeResolution = useCallback(
    (value: string) => {
      setActiveResolution(value as ConflictResolutionPolicy);
    },
    [setActiveResolution],
  );

  const onChangeFile = useCallback(
    (files: File[]) => {
      onChangeFiles(files);
    },
    [onChangeFiles],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded border border-primary p-6 mt-8">
      <div className="mb-2 flex flex-row justify-between">
        <h1>{t(ImportI18nKey.Files)}</h1>
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Next)}
          disabled={!isFilesValid}
          iconAfter={<IconArrowNarrowRight {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onNextStep}
        />
      </div>
      <div className="flex-1 min-h-0 gap-y-8 flex flex-col w-full overflow-auto">
        <DialRadioGroup
          radioButtons={IMPORT_RESOLUTIONS(t)}
          activeRadioButton={activeResolution}
          elementId="conflictResolution"
          fieldTitle={t(ImportI18nKey.ConflictResolution)}
          orientation={RadioGroupOrientation.Column}
          onChange={onChangeResolution}
        />
        <div className="h-[104px]">
          <DialRadioGroup
            radioButtons={IMPORT_FILE_TYPES(t)}
            activeRadioButton={fileType}
            elementId="fileType"
            fieldTitle={t(ImportI18nKey.FileType)}
            orientation={RadioGroupOrientation.Column}
            onChange={onChangeFileType}
          />
        </div>
        <div className="flex-1 min-h-0">
          {fileType === ImportFileType.ARCHIVE ? (
            <DialLoadFileAreaField
              elementId="localFile"
              fieldTitle={t(ImportI18nKey.File)}
              emptyTextFirstLine={t(ImportI18nKey.DropZip)}
              emptyTextSecondLine={t(BasicI18nKey.Or)}
              emptyButtonLabel={t(ButtonsI18nKey.Browse)}
              maxFilesCount={1}
              files={files.length === 0 ? files : [files[0]]}
              multiple={false}
              fileFormatError={t(ImportI18nKey.ArchiveFileFormatError)}
              fileCountError={t(ImportI18nKey.ArchiveDescription)}
              iconBeforeInput={<DialFileIcon extension="zip" className="text-secondary" />}
              acceptTypes=".zip, application/x-zip-compressed, application/zip"
              onChange={onChangeFile}
            />
          ) : (
            <DialLoadFileAreaField
              elementId="localFile"
              fieldTitle={t(ImportI18nKey.Files)}
              emptyTextFirstLine={t(ImportI18nKey.DropFiles)}
              emptyTextSecondLine={t(BasicI18nKey.Or)}
              emptyButtonLabel={t(ButtonsI18nKey.Browse)}
              files={files}
              iconBeforeInput={<DialFileIcon extension="json" className="text-secondary" />}
              acceptTypes="application/JSON"
              fileFormatError={t(ImportI18nKey.JsonFileFormatError)}
              isInvalid={isLargeFile}
              errorText={t(ImportI18nKey.FileError)}
              onChange={onChangeFile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Files;

'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { IconArrowNarrowRight } from '@tabler/icons-react';

import Json from '@/public/images/icons/file/json.svg';
import Zip from '@/public/images/icons/file/zip.svg';
import Button from '@/src/components/Common/Button/Button';
import LoadFileAreaField from '@/src/components/Common/LoadFileArea/LoadFileAreaField';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import { isLargeFile } from '@/src/components/EntityListView/Import/import';
import { ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { IMPORT_RESOLUTIONS } from '@/src/constants/import';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { RadioButtonModel } from '@/src/models/radio-button';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';

const IMPORT_FILE_TYPES = (t: (str: string) => string): RadioButtonModel[] => [
  {
    id: ImportFileType.ARCHIVE,
    name: t(ImportI18nKey.DialArchive),
    description: t(ImportI18nKey.DialArchiveDescription),
  },
  { id: ImportFileType.JSON, name: t(ImportI18nKey.SeparateJsonFiles) },
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
  const t = useI18n() as (str: string) => string;

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
        <h1>{t(ImportI18nKey.ImportFiles)}</h1>
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Next)}
          disable={!isFilesValid}
          iconAfter={<IconArrowNarrowRight {...BASE_ICON_PROPS} />}
          onClick={onNextStep}
        />
      </div>
      <div className="flex-1 min-h-0 gap-y-6 flex flex-col w-full">
        <RadioField
          radioButtons={IMPORT_RESOLUTIONS(t)}
          activeRadioButton={activeResolution}
          elementId="conflictResolution"
          fieldTitle={t(ImportI18nKey.ConflictResolution)}
          orientation={RadioFieldOrientation.Column}
          onChange={onChangeResolution}
        />
        <div className="h-[104px]">
          <RadioField
            radioButtons={IMPORT_FILE_TYPES(t)}
            activeRadioButton={fileType}
            elementId="fileType"
            fieldTitle={t(ImportI18nKey.FileType)}
            orientation={RadioFieldOrientation.Column}
            onChange={onChangeFileType}
          />
        </div>
        <div className="flex-1 min-h-0">
          {fileType === ImportFileType.ARCHIVE ? (
            <LoadFileAreaField
              elementId="localFile"
              fieldTitle={t(ImportI18nKey.File)}
              emptyTitle={t(ImportI18nKey.DropZip)}
              maxFilesCount={1}
              files={files.length === 0 ? files : [files[0]]}
              isMultiple={false}
              fileFormatError={t(ImportI18nKey.ImportArchiveFileFormatError)}
              fileCountError={t(ImportI18nKey.ImportArchiveDescription)}
              iconBeforeInput={
                <i className="text-secondary">
                  <Zip />
                </i>
              }
              acceptTypes=".zip, application/x-zip-compressed"
              onChangeFile={onChangeFile}
            />
          ) : (
            <LoadFileAreaField
              elementId="localFile"
              fieldTitle={t(ImportI18nKey.Files)}
              emptyTitle={t(ImportI18nKey.DropFiles)}
              files={files}
              iconBeforeInput={
                <i className="text-secondary">
                  <Json />
                </i>
              }
              acceptTypes="application/JSON"
              fileFormatError={t(ImportI18nKey.ImportJsonFileFormatError)}
              isInvalid={isLargeFile}
              errorText={t(ImportI18nKey.ImportFileError)}
              onChangeFile={onChangeFile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Files;

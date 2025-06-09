'use client';

import { FC, useCallback, useState } from 'react';

import Json from '@/public/images/icons/file/json.svg';
import Zip from '@/public/images/icons/file/zip.svg';
import { importConfig, importZipConfig } from '@/src/app/[lang]/import-config/actions';
import Button from '@/src/components/Common/Button/Button';
import LoadFileAreaField from '@/src/components/Common/LoadFileArea/LoadFileAreaField';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import { ButtonsI18nKey, ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { IMPORT_RESOLUTIONS } from '@/src/constants/import';
import { ConflictResolutionPolicy, ImportFileTypes } from '@/src/types/import';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { RadioButtonModel } from '@/src/models/radio-button';

const IMPORT_FILE_TYPES = (t: (stringToTranslate: string) => string): RadioButtonModel[] => [
  {
    id: ImportFileTypes.ARCHIVE,
    name: t(ImportI18nKey.DialArchive),
    description: t(ImportI18nKey.DialArchiveDescription),
  },
  { id: ImportFileTypes.JSON, name: t(ImportI18nKey.SeparateJsonFiles) },
];

const ImportConfig: FC = () => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const { showNotification } = useNotification();

  const [files, setFiles] = useState<File[]>([]);
  const [activeResolution, setActiveResolution] = useState(ConflictResolutionPolicy.OVERRIDE);
  const [fileType, setFileType] = useState(ImportFileTypes.ARCHIVE);

  const onImportFile = useCallback(() => {
    const body = new FormData();

    files.forEach((file) => {
      body.append('file', file);
    });
    body.append('resolutionPolicy', activeResolution.toUpperCase());

    (fileType == ImportFileTypes.ARCHIVE ? importZipConfig(body) : importConfig(body)).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(t(ImportI18nKey.ConfigImported), t(ImportI18nKey.ConfigImportedDescription)),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [showNotification, fileType, t, activeResolution, files]);

  const onChangeResolution = useCallback(
    (value: string) => {
      setActiveResolution(value as ConflictResolutionPolicy);
    },
    [setActiveResolution],
  );

  const onChangeFileType = useCallback(
    (value: string) => {
      setFileType(value as ImportFileTypes);
    },
    [setFileType],
  );

  const onChangeFile = useCallback(
    (files: File[]) => {
      setFiles(files);
    },
    [setFiles],
  );

  return (
    <div className="flex flex-col w-full h-full rounded p-4 bg-layer-2">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>{t(MenuI18nKey.ImportConfig)}</h1>

        <Button cssClass="primary" title={t(ButtonsI18nKey.Import)} disable={!files} onClick={onImportFile} />
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

        <RadioField
          radioButtons={IMPORT_FILE_TYPES(t)}
          activeRadioButton={fileType}
          elementId="fileType"
          fieldTitle={t(ImportI18nKey.FileType)}
          orientation={RadioFieldOrientation.Column}
          onChange={onChangeFileType}
        />
        <div className="flex-1 min-h-0">
          {fileType === ImportFileTypes.ARCHIVE ? (
            <LoadFileAreaField
              elementId="localFile"
              fieldTitle={t(ImportI18nKey.Files)}
              emptyTitle={t(ImportI18nKey.DropZip)}
              files={files.length === 0 ? files : [files[0]]}
              isMultiple={false}
              iconBeforeInput={
                <i className="text-secondary">
                  <Zip />
                </i>
              }
              acceptTypes=".zip"
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
              onChangeFile={onChangeFile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportConfig;

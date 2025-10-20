'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { IconArrowNarrowRight, IconZip } from '@tabler/icons-react';
import {
  ButtonVariant,
  RadioButtonWithContent,
  DialButton,
  DialRadioGroup,
  RadioGroupOrientation,
  DialLoadFileAreaField,
  DialIcon,
} from '@epam/ai-dial-ui-kit';

import Json from '@/public/images/icons/file/json.svg';
import { isLargeFile } from '@/src/components/EntityListView/Import/import';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { IMPORT_RESOLUTIONS } from '@/src/constants/import';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';

const IMPORT_FILE_TYPES = (t: (str: string) => string): RadioButtonWithContent[] => [
  {
    id: ImportFileType.ARCHIVE,
    name: t(ImportI18nKey.DialArchive),
    content: <div className="tiny mt-2 ml-[26px]">{t(ImportI18nKey.DialArchiveDescription)}</div>,
  },
  { id: ImportFileType.JSON, name: t(ImportI18nKey.DialCoreFiles) },
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
        <h1>{t(ImportI18nKey.Files)}</h1>
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Next)}
          disable={!isFilesValid}
          iconAfter={<IconArrowNarrowRight {...BASE_ICON_PROPS} />}
          onClick={onNextStep}
        />
      </div>
      <div className="flex-1 min-h-0 gap-y-6 flex flex-col w-full overflow-auto">
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
              iconBeforeInput={<IconZip className="text-secondary" {...BASE_ICON_PROPS} />}
              acceptTypes=".zip, application/x-zip-compressed"
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
              iconBeforeInput={<DialIcon icon={<Json />} className="text-secondary" />}
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

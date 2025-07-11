'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect } from 'react';

import { IconFileTypeZip } from '@tabler/icons-react';

import { CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import LoadFileAreaField from '@/src/components/Common/LoadFileArea/LoadFileAreaField';
import RadioButton from '@/src/components/Common/RadioButton/RadioButton';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { CreateI18nKey, FoldersI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { APPLICATION_ZIP_TYPE } from '@/src/constants/request-headers';
import { useI18n } from '@/src/locales/client';
import { RadioButtonModel } from '@/src/models/radio-button';
import { Step, StepStatus } from '@/src/models/step';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getIcon } from '@/src/utils/files/icon';

interface Props {
  view?: ApplicationRoute;
  files: File[];
  fileTypes: RadioButtonModel[];
  fileType: string;
  setFileType: Dispatch<SetStateAction<string>>;
  setZipFile: Dispatch<SetStateAction<File | null | undefined>>;
  setSeparateFiles: Dispatch<SetStateAction<File[]>>;
  setSteps: Dispatch<SetStateAction<Step[]>>;
  setCurrentStep: Dispatch<SetStateAction<Step>>;
  setFolderName: Dispatch<SetStateAction<string>>;
  folderName: string;
}

const FolderCreateSetup: FC<Props> = ({
  view,
  files,
  fileTypes,
  fileType,
  setFileType,
  setZipFile,
  setSeparateFiles,
  setSteps,
  setCurrentStep,
  setFolderName,
  folderName,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const getFileIcon = (name: string) => {
    return getIcon(getNameExtensionFromFile(name).extension);
  };

  const setCurrentSteps = useCallback(
    (allFiles: File[], name: string) => {
      const status = allFiles.length && name ? StepStatus.VALID : StepStatus.INVALID;
      setSteps((prev) => {
        const setupStepIndex = prev.findIndex((step) => step.id === CreateFolderSteps.FOLDER_SETUP);
        return prev.map((item, i) => {
          if (i === setupStepIndex) {
            return {
              ...item,
              status,
            };
          } else {
            return item;
          }
        });
      });
      setCurrentStep((prev) => {
        return {
          ...prev,
          status,
        };
      });
    },
    [setCurrentStep, setSteps],
  );

  const changeName = useCallback(
    (name: string) => {
      setFolderName(name);
      setCurrentSteps(files, name);
    },
    [setFolderName, setCurrentSteps, files],
  );

  const changeFile = useCallback(
    (files: File[]) => {
      if (fileType === ImportFileType.ARCHIVE) {
        if (files.length === 0 || files[0].type === APPLICATION_ZIP_TYPE) {
          setZipFile(files[0]);
        }
      } else {
        setSeparateFiles(files.slice(0, 30));
      }
      setCurrentSteps(files, folderName);
    },
    [fileType, setCurrentSteps, folderName, setZipFile, setSeparateFiles],
  );

  useEffect(() => {
    setCurrentSteps(files, folderName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileType]);

  return (
    <>
      <div className="w-[50%]">
        <TextInputField
          fieldTitle={t(CreateI18nKey.NameTitle)}
          elementId="name"
          placeholder={t(FoldersI18nKey.FolderCreatePlaceholder)}
          value={folderName}
          onChange={changeName}
        />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="pt-6 pb-4">{t(ImportI18nKey.FileType)}</h3>
        {fileTypes.map((type) => (
          <RadioButton
            key={type.id}
            inputId={type.id}
            title={type.name}
            description={type.description}
            checked={type.id === fileType}
            onChange={() => setFileType(type.id)}
          />
        ))}
        <div className="mt-2 flex-1 min-h-0">
          {fileType === ImportFileType.ARCHIVE && (
            <LoadFileAreaField
              elementId="importArchive"
              files={files?.[0] ? [files[0]] : []}
              fieldTitle={t(ImportI18nKey.File)}
              emptyTitle={t(ImportI18nKey.DropAnyFile)}
              iconBeforeInput={<IconFileTypeZip width={18} height={18} className="text-secondary" />}
              fileFormatError={t(ImportI18nKey.ImportArchiveFileFormatError)}
              fileCountError={t(ImportI18nKey.ImportArchiveDescription)}
              acceptTypes="application/zip, .zip, application/x-zip-compressed"
              onChangeFile={changeFile}
              isMultiple={false}
            />
          )}

          {fileType === ImportFileType.FILES && (
            <LoadFileAreaField
              elementId="importFiles"
              fieldTitle={t(ImportI18nKey.ImportFiles)}
              emptyTitle={t(ImportI18nKey.DropAnyFile)}
              files={files}
              acceptTypes={view === ApplicationRoute.Prompts ? 'application/json' : '/'}
              onChangeFile={changeFile}
              dynamicIcon={getFileIcon}
              errorText={t(ImportI18nKey.ImportFileError)}
              maxFilesCount={30}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FolderCreateSetup;

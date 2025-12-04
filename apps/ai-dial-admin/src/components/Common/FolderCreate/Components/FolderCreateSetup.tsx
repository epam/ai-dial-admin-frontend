'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialFileIcon,
  DialLoadFileAreaField,
  DialRadioGroup,
  DialSwitch,
  DialTextInputField,
  RadioButtonWithContent,
  RadioGroupOrientation,
  Step,
  StepStatus,
} from '@epam/ai-dial-ui-kit';

import Field from '@/src/components/Common/Field/Field';
import { CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import { BasicI18nKey, ButtonsI18nKey, FoldersI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { APPLICATION_ZIP_TYPE } from '@/src/constants/request-headers';
import { useI18n } from '@/src/locales/client';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { getErrorForFolderName } from '@/src/utils/validation/folder-error';

interface Props {
  view?: ApplicationRoute;
  files: File[];
  fileTypes: RadioButtonWithContent[];
  fileType: string;
  setFileType: Dispatch<SetStateAction<string>>;
  setZipFile: Dispatch<SetStateAction<File | null | undefined>>;
  setSeparateFiles: Dispatch<SetStateAction<File[]>>;
  setSteps: Dispatch<SetStateAction<Step[]>>;
  setFolderName: Dispatch<SetStateAction<string>>;
  folderName: string;
  ignorePaths?: boolean;
  setIgnorePaths?: Dispatch<SetStateAction<boolean>>;
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
  setFolderName,
  folderName,
  ignorePaths,
  setIgnorePaths,
}) => {
  const t = useI18n();

  const ignorePathsTitle = useMemo(() => {
    if (view === ApplicationRoute.Prompts) {
      return t(ImportI18nKey.PathsPrompt);
    }
    if (view === ApplicationRoute.Files) {
      return t(ImportI18nKey.PathsFile);
    }
    return '';
  }, [t, view]);

  const acceptTypes = useMemo(() => {
    if (view === ApplicationRoute.Prompts) {
      return 'application/json';
    }
    if (view === ApplicationRoute.Files) {
      return '/';
    }
    return '';
  }, [view]);

  const [nameErrorText, setNameErrorText] = useState('');

  const getFileIcon = (name: string) => {
    return <DialFileIcon extension={getNameExtensionFromFile(name).extension} />;
  };

  const setCurrentSteps = useCallback(
    (allFiles: File[], name: string, errorText?: string) => {
      const status = allFiles.length && name && !errorText ? StepStatus.VALID : void 0;
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
    },
    [setSteps],
  );

  const changeName = useCallback(
    (name?: string) => {
      const error = getErrorForFolderName(name, void 0, t, true);
      setNameErrorText(error?.text || '');
      setFolderName(name || '');
      setCurrentSteps(files, name || '', error?.text);
    },
    [t, setFolderName, setCurrentSteps, files],
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
        <DialTextInputField
          fieldTitle={t(FoldersI18nKey.FolderName)}
          elementId="name"
          placeholder={t(FoldersI18nKey.FolderCreatePlaceholder)}
          value={folderName}
          onChange={changeName}
          invalid={!!nameErrorText}
          errorText={nameErrorText}
        />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col gap-4 mt-6">
          <DialRadioGroup
            fieldTitle={t(ImportI18nKey.FileType)}
            orientation={RadioGroupOrientation.Column}
            radioButtons={fileTypes}
            activeRadioButton={fileType}
            elementId="conflict-resolution"
            onChange={setFileType}
          />
          {view === ApplicationRoute.Prompts && (
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
        <div className="mt-2 flex-1 min-h-0">
          {fileType === ImportFileType.ARCHIVE && (
            <DialLoadFileAreaField
              elementId="importArchive"
              files={files?.[0] ? [files[0]] : []}
              fieldTitle={t(ImportI18nKey.File)}
              emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
              emptyTextSecondLine={t(BasicI18nKey.Or)}
              emptyButtonLabel={t(ButtonsI18nKey.Browse)}
              iconBeforeInput={<DialFileIcon extension="zip" className="text-secondary" />}
              fileFormatError={t(ImportI18nKey.ArchiveFileFormatError)}
              fileCountError={t(ImportI18nKey.ArchiveDescription)}
              acceptTypes="application/zip, .zip, application/x-zip-compressed"
              onChange={changeFile}
              multiple={false}
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
              acceptTypes={acceptTypes}
              onChange={changeFile}
              dynamicIcon={getFileIcon}
              errorText={t(ImportI18nKey.FileError)}
              maxFilesCount={30}
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
              onChange={changeFile}
              maxFilesCount={30}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FolderCreateSetup;

'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';

import Popup from '@/src/components/Common/Popup/Popup';
import Steps from '@/src/components/Common/Steps/Steps';
import { getMultipleImportStatus, isInvalidJson, isLargeFile } from '@/src/components/EntityListView/Import/import';
import { FoldersI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { IMPORT_FILE_TYPES, IMPORT_RESOLUTIONS, IMPORT_STEPS } from '@/src/constants/import';
import { APPLICATION_ZIP_TYPE } from '@/src/constants/request-headers';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportMap } from '@/src/models/file';
import { ParsedPrompts } from '@/src/models/prompts';
import { Step, StepStatus } from '@/src/models/step';
import { ConflictResolutionPolicy, ImportFileType as FileType, ImportSteps } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import ImportConflicts from './ImportConflicts';
import ImportFileTypeSelector from './ImportFileType';
import ImportModalButtons from './ImportModalButtons';

const MAX_FILES_COUNT = 30;

interface Props {
  modalState: PopUpState;
  route?: ApplicationRoute;
  context?: () => PromptFolderContextType | FileFolderContextType;
  onClose: () => void;
  onApply?: (fileType: FileType, file: File | File[] | ParsedPrompts, resolution: string, path: string) => void;
}

const ImportModal: FC<Props> = ({ modalState, route, context, onClose, onApply }) => {
  const containerClassName = classNames('h-[660px] lg:max-w-[45%]');
  const folderContext = context?.();
  const t = useI18n() as (stringToTranslate: string) => string;

  const fileTypes = IMPORT_FILE_TYPES(t, route);
  const [resolutions, setResolutions] = useState(IMPORT_RESOLUTIONS(t));

  const [steps, setSteps] = useState(IMPORT_STEPS(t));
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);

  const [fileType, setFileType] = useState(fileTypes[0].id);
  const [resolution, setResolution] = useState(resolutions[0].id);

  const [zipFile, setZipFile] = useState<File | null>();
  const [jsonFiles, setJsonFiles] = useState<File[]>([]);
  const [separateFiles, setSeparateFiles] = useState<File[]>([]);

  const [jsonFileMap, setJsonFileMap] = useState(new Map<string, FileImportMap>());
  const [editedFileMap, setEditedFileMap] = useState(new Map<string, FileImportMap>());

  const [separateFileMap, setSeparateFileMap] = useState(new Map<string, FileImportMap>());

  const readJsonFile = useCallback((file: File | null, urlToRemove?: string) => {
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsedData: ParsedPrompts = JSON.parse(reader.result as string);
          const isInvalid = isInvalidJson(parsedData);
          setJsonFileMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(file.name, { files: parsedData?.prompts, isInvalid });
            return newMap;
          });
        } catch (error) {
          setJsonFileMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(file.name, { files: [], isInvalid: true });
            return newMap;
          });
          console.error('Error parsing JSON:', error);
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
      };

      reader.readAsText(file);
    } else {
      setJsonFileMap((prev) => {
        const newMap = new Map(prev);
        if (urlToRemove) {
          newMap.delete(urlToRemove);
        }
        return newMap;
      });
    }
  }, []);

  const changeFileType = useCallback(
    (type: string) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === ImportSteps.PROPERTIES);
        return prev.map((item, i) => (i === index ? { ...item, status: StepStatus.INVALID } : item));
      });
      setResolutions(IMPORT_RESOLUTIONS(t, type));
      setFileType(type);
      if (type === FileType.ARCHIVE) {
        setJsonFiles([]);
        setJsonFileMap(new Map());
        setSeparateFiles([]);
        setSeparateFileMap(new Map());
      } else {
        setZipFile(null);
      }
    },
    [setFileType, t],
  );

  const changeFile = useCallback(
    (files: File[]) => {
      if (fileType === FileType.ARCHIVE) {
        if (files.length === 0 || files[0].type === APPLICATION_ZIP_TYPE) {
          setZipFile(files[0]);
        }
      } else if (fileType === FileType.JSON) {
        const sliced = files.slice(0, MAX_FILES_COUNT);
        sliced.forEach((file) => readJsonFile(file));
        setJsonFiles(sliced);
        if (sliced.length === 0) {
          setJsonFileMap(new Map());
        }
      } else {
        const sliced = files.slice(0, MAX_FILES_COUNT);
        sliced.forEach((file) => {
          const isInvalid = isLargeFile(file);
          setSeparateFileMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(file.name, { files: [file] as unknown as DialFile[], isInvalid });
            return newMap;
          });
        });
        if (sliced.length === 0) {
          setSeparateFileMap(new Map());
        }
        setSeparateFiles(sliced);
      }
    },
    [fileType, readJsonFile],
  );

  const setStepsState = useCallback(
    (status: StepStatus) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === currentStep.id);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
      setCurrentStep((prev) => {
        return {
          ...prev,
          status,
        };
      });
    },
    [currentStep.id],
  );

  const isInvalidFile = useCallback(
    (file: File) => {
      return !!(fileType === FileType.JSON ? jsonFileMap : separateFileMap).get(file?.name)?.isInvalid;
    },
    [jsonFileMap, separateFileMap, fileType],
  );

  const onFinishClick = () => {
    if (fileType === FileType.ARCHIVE) {
      onApply?.(fileType, zipFile as File, resolution, folderContext?.filePath as string);
    } else if (fileType === FileType.JSON) {
      const map = resolution === ConflictResolutionPolicy.MANUAL ? editedFileMap : jsonFileMap;
      const jsonFile = {
        prompts: Array.from(map.values()).flatMap((value) => value.files as DialPrompt[]),
      };
      onApply?.(fileType, jsonFile, resolution, folderContext?.filePath as string);
    } else if (fileType === FileType.FILES) {
      const map = resolution === ConflictResolutionPolicy.MANUAL ? editedFileMap : separateFileMap;
      onApply?.(
        fileType,
        Array.from(map.values()).flatMap((value) => value.files as unknown as File[]),
        resolution,
        folderContext?.filePath as string,
      );
    }
  };

  useEffect(() => {
    setStepsState(StepStatus.INVALID);
  }, [fileType, setStepsState]);

  useEffect(() => {
    if (resolution) {
      setStepsState(StepStatus.VALID);
    }
  }, [resolution, setStepsState]);

  useEffect(() => {
    if (currentStep.id === ImportSteps.FILES) {
      const zipStatus = zipFile ? StepStatus.VALID : StepStatus.INVALID;
      const filesStatus = getMultipleImportStatus(fileType === FileType.JSON ? jsonFileMap : separateFileMap);
      const status = fileType === FileType.ARCHIVE ? zipStatus : filesStatus;
      setStepsState(status);
    }
  }, [zipFile, fileType, setStepsState, jsonFileMap, currentStep.id, separateFileMap]);

  return (
    <Popup
      onClose={onClose}
      heading={route === ApplicationRoute.Prompts ? t(PromptsI18nKey.Import) : t(FoldersI18nKey.Import)}
      portalId="ImportModal"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex px-6 py-4 flex-1 flex-col min-h-0">
        <Steps steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <div className={currentStep.id === ImportSteps.FILES ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
          <ImportFileTypeSelector
            files={
              fileType === FileType.ARCHIVE
                ? zipFile
                  ? [zipFile]
                  : []
                : fileType === FileType.JSON
                  ? jsonFiles
                  : separateFiles
            }
            fileType={fileType}
            fileTypes={fileTypes}
            changeFileType={changeFileType}
            changeFile={changeFile}
            isInvalid={isInvalidFile}
            maxFilesCount={MAX_FILES_COUNT}
          />
        </div>
        {currentStep.id === ImportSteps.PROPERTIES && (
          <ImportConflicts
            route={route}
            existing={folderContext?.data || []}
            filesMap={fileType === FileType.JSON ? jsonFileMap : separateFileMap}
            setEditedFileMap={setEditedFileMap}
            resolutions={resolutions}
            resolution={resolution}
            setResolution={setResolution}
            setStepsState={setStepsState}
          />
        )}
      </div>
      <ImportModalButtons
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onFinishClick={onFinishClick}
      />
    </Popup>
  );
};

export default ImportModal;

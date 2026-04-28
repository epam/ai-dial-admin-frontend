'use client';

import { DialPopup, DialSteps, StepStatus } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import {
  determineFilesType,
  getModalTitle,
  getMultipleImportStatus,
  isInvalidJson,
  isLargeFile,
} from '@/src/components/EntityListView/Import/utils';
import { IMPORT_FILE_TYPES, IMPORT_RESOLUTIONS, IMPORT_STEPS } from '@/src/constants/import';
import { APPLICATION_ZIP_TYPES } from '@/src/constants/request-headers';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportMap } from '@/src/models/file';
import { ImportData, ParsedAssets } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType as FileType, ImportSteps } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import ImportConflicts from './ImportConflicts';
import ImportFileTypeSelector from './ImportFileType';
import { MAX_FILE_SIZE_MB } from '@/src/constants/file';

const MAX_FILES_COUNT = 30;
const MAX_TOTAL_FILE_SIZE_MB = 64;
const MAX_TOTAL_FILE_SIZE_BYTES = MAX_TOTAL_FILE_SIZE_MB * 1024 * 1024;

interface Props {
  isModalOpen: boolean;
  route?: ApplicationRoute;
  getAssetContext?: () => AssetsFolderContext;
  onClose: () => void;
  onApply?: (fileType: FileType, file: ImportData, resolution: string, path: string, ignorePaths?: boolean) => void;
  preselectedItems?: File[];
}

const ImportModal: FC<Props> = ({ isModalOpen, route, getAssetContext, onClose, onApply, preselectedItems }) => {
  const folderContext = getAssetContext?.();
  const t = useI18n();

  const fileTypes = useMemo(() => IMPORT_FILE_TYPES(t, route), [t, route]);
  const [resolutions, setResolutions] = useState(IMPORT_RESOLUTIONS(t));

  const [steps, setSteps] = useState(IMPORT_STEPS(t));
  const [currentStepId, setCurrentStepId] = useState(steps[0].id);

  const [ignorePaths, setIgnorePaths] = useState(false);
  const [fileType, setFileType] = useState(fileTypes[0].id);
  const [resolution, setResolution] = useState(resolutions[0].id);

  const [zipFile, setZipFile] = useState<File | null>();
  const [jsonFiles, setJsonFiles] = useState<File[]>([]);
  const [separateFiles, setSeparateFiles] = useState<File[]>([]);

  const [jsonFileMap, setJsonFileMap] = useState(new Map<string, FileImportMap>());
  const [editedFileMap, setEditedFileMap] = useState(new Map<string, FileImportMap>());

  const [separateFileMap, setSeparateFileMap] = useState(new Map<string, FileImportMap>());

  const files = useMemo(() => {
    if (fileType === FileType.ARCHIVE) {
      return zipFile ? [zipFile] : [];
    }
    return fileType === FileType.JSON ? jsonFiles : separateFiles;
  }, [fileType, zipFile, jsonFiles, separateFiles]);

  const totalFileSizeExceeded = useMemo(() => {
    if (fileType === FileType.ARCHIVE) {
      return false;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize > MAX_TOTAL_FILE_SIZE_BYTES;
  }, [fileType, files]);

  const onReadJsonFile = useCallback(
    (file: File | null, urlToRemove?: string) => {
      if (file) {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const parsedData: ParsedAssets = JSON.parse(reader.result as string);
            const isInvalid = isInvalidJson(parsedData, route);
            setJsonFileMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(file.name, {
                files: parsedData?.prompts || parsedData.applications || parsedData.toolSets || [],
                isInvalid,
              });
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
    },
    [route],
  );

  const onChangeFileType = useCallback(
    (type: string) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === ImportSteps.PROPERTIES);
        return prev.map((item, i) => (i === index ? { ...item, status: void 0 } : item));
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

  const changeFiles = useCallback(
    (files: File[], type: string) => {
      if (type === FileType.ARCHIVE) {
        if (files.length === 0 || APPLICATION_ZIP_TYPES.includes(files[0].type)) {
          setZipFile(files[0]);
        }
      } else if (type === FileType.JSON) {
        const sliced = files.slice(0, MAX_FILES_COUNT);

        setJsonFileMap(new Map());
        sliced.forEach((file) => onReadJsonFile(file));
        setJsonFiles(sliced);
      } else {
        const sliced = files.slice(0, MAX_FILES_COUNT);
        const newSeparateFileMap = new Map<string, FileImportMap>();

        sliced.forEach((file) => {
          const isInvalid = isLargeFile(file, MAX_FILE_SIZE_MB);
          newSeparateFileMap.set(file.name, { files: [file] as unknown as DialFile[], isInvalid });
        });

        setSeparateFileMap(newSeparateFileMap);
        setSeparateFiles(sliced);
      }
    },
    [onReadJsonFile],
  );

  const onChangeFile = useCallback(
    (files: File[]) => {
      changeFiles(files, fileType);
    },
    [fileType, changeFiles],
  );

  const onChangeSteps = useCallback(
    (status?: StepStatus) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === currentStepId);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
    },
    [currentStepId],
  );

  const isInvalidFile = useCallback(
    (file: File) => {
      if (totalFileSizeExceeded && fileType !== FileType.ARCHIVE) {
        return true;
      }

      return !!(fileType === FileType.JSON ? jsonFileMap : separateFileMap).get(file?.name)?.isInvalid;
    },
    [jsonFileMap, separateFileMap, fileType, totalFileSizeExceeded],
  );

  const onFinishClick = () => {
    if (fileType === FileType.ARCHIVE) {
      onApply?.(fileType, zipFile as File, resolution, folderContext?.filePath as string, ignorePaths);
    } else if (fileType === FileType.JSON) {
      const map = resolution === ConflictResolutionPolicy.MANUAL ? editedFileMap : jsonFileMap;
      const jsonFile = {
        [getJsonFileName(route)]: Array.from(map.values()).flatMap((value) => value.files as DialPrompt[]),
      };
      onApply?.(fileType, jsonFile, resolution, folderContext?.filePath as string, ignorePaths);
    } else if (fileType === FileType.FILES) {
      const map = resolution === ConflictResolutionPolicy.MANUAL ? editedFileMap : separateFileMap;
      onApply?.(
        fileType,
        Array.from(map.values()).flatMap((value) => value.files as unknown as File[]),
        resolution,
        folderContext?.filePath as string,
        ignorePaths,
      );
    }
  };

  useEffect(() => {
    if (preselectedItems?.length) {
      const preselectedFileType = determineFilesType(
        preselectedItems,
        fileTypes.map((item) => item.id),
      );
      if (preselectedFileType) {
        setFileType(preselectedFileType);
        changeFiles(preselectedItems, preselectedFileType);
      }
    }
  }, [preselectedItems, fileTypes, changeFiles]);

  useEffect(() => {
    onChangeSteps();
  }, [fileType, onChangeSteps]);

  useEffect(() => {
    if (resolution) {
      onChangeSteps(StepStatus.VALID);
    }
  }, [resolution, onChangeSteps]);

  useEffect(() => {
    if (currentStepId === ImportSteps.FILES) {
      const zipStatus = zipFile ? StepStatus.VALID : void 0;
      const filesStatus = getMultipleImportStatus(fileType === FileType.JSON ? jsonFileMap : separateFileMap);
      const status = fileType === FileType.ARCHIVE ? zipStatus : totalFileSizeExceeded ? StepStatus.ERROR : filesStatus;
      onChangeSteps(status);
    }
  }, [zipFile, fileType, onChangeSteps, jsonFileMap, currentStepId, separateFileMap, totalFileSizeExceeded]);

  return (
    <DialPopup
      onClose={onClose}
      header={getModalTitle(route, t)}
      portalId="ImportModal"
      className="h-[660px]"
      open={isModalOpen}
      footer={
        <StepperModalButtons
          steps={steps}
          currentStep={steps.find((step) => step.id === currentStepId)}
          onChangeStep={setCurrentStepId}
          onFinishClick={onFinishClick}
          onClose={onClose}
        />
      }
    >
      <div className="flex px-6 py-4 h-full flex-col">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStepId} />
        <div className={currentStepId === ImportSteps.FILES ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
          <ImportFileTypeSelector
            files={files}
            fileType={fileType}
            fileTypes={fileTypes}
            onChangeFileType={onChangeFileType}
            onChangeFile={onChangeFile}
            isInvalid={isInvalidFile}
            maxFilesCount={MAX_FILES_COUNT}
            totalFileSizeExceeded={totalFileSizeExceeded}
            ignorePaths={ignorePaths}
            setIgnorePaths={setIgnorePaths}
            route={route}
          />
        </div>
        {currentStepId === ImportSteps.PROPERTIES && (
          <ImportConflicts
            route={route}
            existing={folderContext?.data || []}
            filesMap={fileType === FileType.JSON ? jsonFileMap : separateFileMap}
            setEditedFileMap={setEditedFileMap}
            resolutions={resolutions}
            resolution={resolution}
            setResolution={setResolution}
            setStepsState={onChangeSteps}
          />
        )}
      </div>
    </DialPopup>
  );
};

export default ImportModal;

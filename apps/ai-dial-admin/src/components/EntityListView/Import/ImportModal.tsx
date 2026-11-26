'use client';

import { ErrorText, Popup, Steps, StepStatus } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getStepStatusLabels } from '@/src/components/Common/Steps/utils';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import {
  applyToolsetClientSecrets,
  determineFilesType,
  getExistingFolderItems,
  getModalTitle,
  getMultipleImportStatus,
  isInvalidJson,
} from '@/src/components/EntityListView/Import/utils';
import { IMPORT_FILE_TYPES, IMPORT_RESOLUTIONS, IMPORT_STEPS } from '@/src/constants/import';
import { ImportI18nKey } from '@/src/constants/i18n';
import { APPLICATION_ZIP_TYPES } from '@/src/constants/request-headers';
import type { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportMap } from '@/src/models/file';
import { ImportData, ParsedAssets } from '@/src/models/import-asset';
import { ImportFileType as FileType, ImportSteps } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import ImportConflicts from './ImportConflicts';
import ImportFileTypeSelector from './ImportFileType';
import { getImportSizeLimits } from '@/src/utils/import/get-import-size-limits';

const MAX_FILES_COUNT = 30;

interface Props {
  isModalOpen: boolean;
  route?: ApplicationRoute;
  getAssetContext?: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
  onApply?: (
    fileType: FileType,
    file: ImportData,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => ImportI18nKey | void;
  preselectedItems?: File[];
  /** `ENABLE_UNSAFE_TOOLSET_IMPORT`: lets a toolset JSON import supply a client secret for its OAUTH toolsets. */
  isUnsafeImportEnabled?: boolean;
}

const ImportModal: FC<Props> = ({
  isModalOpen,
  route,
  getAssetContext,
  onClose,
  onApply,
  preselectedItems,
  isUnsafeImportEnabled,
}) => {
  const folderContext = getAssetContext?.();
  const t = useI18n();

  const existingFolderItems = useMemo(() => getExistingFolderItems(folderContext), [folderContext]);

  const fileTypes = useMemo(() => IMPORT_FILE_TYPES(t, route), [t, route]);
  const [resolutions, setResolutions] = useState(IMPORT_RESOLUTIONS(t));

  const [steps, setSteps] = useState(IMPORT_STEPS(t));
  const [currentStepId, setCurrentStepId] = useState(steps[0].id);

  const [ignorePaths, setIgnorePaths] = useState(false);
  const [fileType, setFileType] = useState(fileTypes[0].id);
  const [resolution, setResolution] = useState(resolutions[0].id);
  const [submissionError, setSubmissionError] = useState<ImportI18nKey>();

  const [zipFile, setZipFile] = useState<File | null>();
  const [jsonFiles, setJsonFiles] = useState<File[]>([]);
  const [separateFiles, setSeparateFiles] = useState<File[]>([]);

  const [jsonFileMap, setJsonFileMap] = useState(new Map<string, FileImportMap>());
  const fileSelectionVersion = useRef(0);
  const [editedFileMap, setEditedFileMap] = useState(new Map<string, FileImportMap>());

  const [separateFileMap, setSeparateFileMap] = useState(new Map<string, FileImportMap>());

  const files = useMemo(() => {
    if (fileType === FileType.ARCHIVE) {
      return zipFile ? [zipFile] : [];
    }
    return fileType === FileType.JSON ? jsonFiles : separateFiles;
  }, [fileType, zipFile, jsonFiles, separateFiles]);

  const shouldHandleClientSecrets =
    !!isUnsafeImportEnabled && route === ApplicationRoute.AssetsToolsets && fileType === FileType.JSON;

  const { maxFileSizeMb, maxMultiFilesSizeMb } = getImportSizeLimits(route);
  const isFileSizeExceeded =
    fileType !== FileType.FILES && files.some((file) => file.size > maxFileSizeMb * 1024 * 1024);
  const isFileCountExceeded = fileType !== FileType.ARCHIVE && files.length > MAX_FILES_COUNT;

  const totalFileSizeExceeded = useMemo(() => {
    if (fileType === FileType.ARCHIVE) {
      return false;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize > maxMultiFilesSizeMb * 1024 * 1024;
  }, [fileType, files, maxMultiFilesSizeMb]);

  const onReadJsonFile = useCallback(
    (file: File | null, selectionVersion: number, urlToRemove?: string) => {
      if (file) {
        const reader = new FileReader();

        reader.onload = () => {
          if (selectionVersion !== fileSelectionVersion.current) {
            return;
          }
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
      fileSelectionVersion.current += 1;
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === ImportSteps.PROPERTIES);
        return prev.map((item, i) => (i === index ? { ...item, status: void 0 } : item));
      });
      setResolutions(IMPORT_RESOLUTIONS(t));
      setFileType(type);
      setEditedFileMap(new Map());
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
      const selectionVersion = ++fileSelectionVersion.current;
      setEditedFileMap(new Map());

      if (type === FileType.ARCHIVE) {
        if (files.length === 0 || APPLICATION_ZIP_TYPES.includes(files[0].type)) {
          setZipFile(files[0]);
        }
      } else if (type === FileType.JSON) {
        setJsonFileMap(new Map());
        if (
          files.length <= MAX_FILES_COUNT &&
          files.every((file) => file.size <= maxFileSizeMb * 1024 * 1024) &&
          files.reduce((sum, file) => sum + file.size, 0) <= maxMultiFilesSizeMb * 1024 * 1024
        ) {
          files.forEach((file) => onReadJsonFile(file, selectionVersion));
        }
        setJsonFiles(files);
      } else {
        const newSeparateFileMap = new Map<string, FileImportMap>();

        files.forEach((file) => {
          newSeparateFileMap.set(file.name, { files: [file] as unknown as DialFile[], isInvalid: false });
        });

        setSeparateFileMap(newSeparateFileMap);
        setSeparateFiles(files);
      }
    },
    [maxFileSizeMb, maxMultiFilesSizeMb, onReadJsonFile],
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
    if (isFileSizeExceeded || isFileCountExceeded || totalFileSizeExceeded) {
      return;
    }
    setSubmissionError(undefined);
    if (fileType === FileType.ARCHIVE) {
      const error = onApply?.(fileType, zipFile as File, resolution, folderContext?.filePath as string, ignorePaths);
      if (error) setSubmissionError(error);
    } else if (fileType === FileType.JSON) {
      const map = editedFileMap.size ? editedFileMap : jsonFileMap;
      const files = Array.from(map.values()).flatMap((value) => value.files as DialPrompt[]);
      const jsonFile = {
        [getJsonFileName(route)]: shouldHandleClientSecrets ? applyToolsetClientSecrets(files, resolution) : files,
      };
      const error = onApply?.(fileType, jsonFile, resolution, folderContext?.filePath as string, ignorePaths);
      if (error) setSubmissionError(error);
    } else if (fileType === FileType.FILES) {
      const map = editedFileMap.size ? editedFileMap : separateFileMap;
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
      const hasPendingJson = fileType === FileType.JSON && files.some((file) => !jsonFileMap.has(file.name));
      const filesStatus = hasPendingJson
        ? undefined
        : getMultipleImportStatus(fileType === FileType.JSON ? jsonFileMap : separateFileMap);
      const hasLimitError = isFileSizeExceeded || isFileCountExceeded || totalFileSizeExceeded;
      const fileStatus = fileType === FileType.ARCHIVE ? zipStatus : filesStatus;
      const status = hasLimitError ? StepStatus.ERROR : fileStatus;
      onChangeSteps(status);
    }
  }, [
    zipFile,
    fileType,
    files,
    onChangeSteps,
    jsonFileMap,
    currentStepId,
    separateFileMap,
    totalFileSizeExceeded,
    isFileSizeExceeded,
    isFileCountExceeded,
  ]);

  return (
    <Popup
      onClose={onClose}
      closeOnOutsideClick={false}
      header={getModalTitle(route, t)}
      portalId="ImportModal"
      className="md:h-[660px]"
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
        <Steps
          steps={steps}
          currentStep={currentStepId}
          onChangeStep={setCurrentStepId}
          ariaLabel={getModalTitle(route, t)}
          statusLabels={getStepStatusLabels(t)}
        />
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
            isFileSizeExceeded={isFileSizeExceeded}
            isFileCountExceeded={isFileCountExceeded}
            ignorePaths={ignorePaths}
            setIgnorePaths={setIgnorePaths}
            route={route}
          />
        </div>
        {submissionError && (
          <div role="alert">
            <ErrorText text={t(submissionError, { size: maxFileSizeMb })} />
          </div>
        )}
        {currentStepId === ImportSteps.PROPERTIES && (
          <ImportConflicts
            route={route}
            existing={existingFolderItems}
            filesMap={fileType === FileType.JSON ? jsonFileMap : separateFileMap}
            setEditedFileMap={setEditedFileMap}
            resolutions={resolutions}
            resolution={resolution}
            setResolution={setResolution}
            setStepsState={onChangeSteps}
            withClientSecret={shouldHandleClientSecrets}
          />
        )}
      </div>
    </Popup>
  );
};

export default ImportModal;

import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import {
  generateNameVersionForPrompt,
  getNameVersionFromPrompt,
  modifyNameVersionInPrompt,
} from '@/src/utils/prompts/versions';
import { NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  ApplicationsI18nKey,
  FoldersI18nKey,
  ImportI18nKey,
  PromptsI18nKey,
  ToolsetI18nKey,
} from '@/src/constants/i18n';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ImportResult } from '@/src/models/import';
import { Notification } from '@/src/models/notification';
import { ParsedAssets, AssetImportGridData } from '@/src/models/import-asset';
import { ImportStatus } from '@/src/types/import';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import FileNameCellRenderer from '@/src/components/Grid/CellRenderers/FileNameCellRenderer';
import { StepStatus } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { AssetApp } from '@/src/models/dial/deployment-asset';

/**
 * Generate notifications with results of JSON prompt results
 *
 * @param {ImportResult[]} results - response with importing results
 * @param {string} folderName - current folder name
 * @param {(t: string, options?: Record<string, string | number>) => string} t - function for translate
 * @param {(config: Notification) => string} showNotification - function for create notification
 * @returns {string, showNotification: (config: Notification) => string) => void}
 */
export const getImportResults = (
  results: ImportResult[],
  folderName: string,
  type: string,
  t: (t: string, options?: Record<string, string | number>) => string,
  showNotification?: (config: Notification) => string,
) => {
  if (!showNotification) {
    return;
  }

  let success = 0;
  const skipped: string[] = [];
  const failed: string[] = [];
  results.forEach((result) => {
    if (result.status === ImportStatus.SUCCESS) {
      success += 1;
    }
    if (result.status === ImportStatus.SKIP) {
      skipped.push(result.targetPath);
    }
    if (result.status === ImportStatus.ERROR || result.status === ImportStatus.FAILED) {
      failed.push(result.targetPath);
    }
  });

  if (success > 0) {
    showNotification(
      getSuccessNotification(
        t(ImportI18nKey.SuccessTitle, { number: success, type }),
        t(ImportI18nKey.SuccessDescription, { folder: folderName }),
      ),
    );
  }
  if (failed.length > 0) {
    showNotification(
      getErrorNotification(
        t(ImportI18nKey.ErrorTitle, { number: failed.length, type }),
        `${t(ImportI18nKey.ErrorDescription)}\n${failed.join('\n')}`,
      ),
    );
  }
  if (skipped.length > 0) {
    showNotification(
      getErrorNotification(
        t(ImportI18nKey.SkipTitle, { number: skipped.length, type }),
        `${t(ImportI18nKey.SkipDescription)}\n${skipped.join('\n')}`,
      ),
    );
  }
};

/**
 * Generate import status for stepper based on selected prompts
 *
 * @param {Map<string, FileImportMap>} map - map of selected files for import
 * @returns {StepStatus} - status string
 */
export const getMultipleImportStatus = (map: Map<string, FileImportMap>): StepStatus | undefined => {
  const files = Array.from(map.values());
  if (files.length === 0) {
    return;
  } else if (files.some((value) => value.isInvalid)) {
    return StepStatus.ERROR;
  }
  return StepStatus.VALID;
};

/**
 * Convert selected for import data into grid data with errors
 *
 * @param {Map<string, FileImportMap>} editedFileMap - data map for import
 * @param {?DialPrompt[]} [existingData] - array of already existing in current folder data
 * @returns {AssetImportGridData[]} - array of AssetImportGridData
 */
export const generateAssetRowDataForImportGrid = (
  editedFileMap: Map<string, FileImportMap>,
  existingData?: (DialPrompt | AssetApp)[],
  t?: (t: string) => string,
): AssetImportGridData[] => {
  const data: AssetImportGridData[] = [];

  editedFileMap.forEach((value, key) => {
    const { extension } = getNameExtensionFromFile(key);
    if (!value.isInvalid) {
      value.files.forEach((file, index) => {
        const nameData = file.id
          ? getNameVersionFromPrompt(getFolderNameAndPath(file.id as string).name)
          : { name: file.name as string, version: (file as AssetApp).version as string };

        data.push({
          index,
          name: key,
          version: nameData.version,
          assetName: nameData.name,
          existingNames: existingData?.map((p) => getFolderNameAndPath(p.path).name),
          extension,
        });
      });
    } else {
      data.push({
        index: 0,
        name: key,
        version: '',
        assetName: t?.(ImportI18nKey.PromptError) || '',
        invalid: true,
        extension,
      });
    }
  });

  return data;
};

/**
 * Convert selected for import DialFile data into grid data with errors
 *
 * @param {Map<string, FileImportMap>} filesMap - DialFile map for import
 * @param {?DialFile[]} [existingFiles] - array of already existing in current folder Files
 * @returns {FileImportGridData[]} - array of FileImportGridData
 */
export const generateFileRowDataForImportGrid = (
  filesMap: Map<string, FileImportMap>,
  existingFiles?: DialFile[],
  t?: (t: string) => string,
): FileImportGridData[] => {
  const data: FileImportGridData[] = [];

  filesMap.forEach((value, key) => {
    if (!value.isInvalid) {
      value.files.forEach((file, index) => {
        const name = file.name as string;
        const { name: fileName, extension } = getNameExtensionFromFile(name);
        data.push({
          index,
          name: key,
          extension,
          fileName: fileName,
          existingNames: existingFiles?.map((f) => f.name as string),
        });
      });
    } else {
      data.push({
        index: 0,
        name: key,
        fileName: t?.(ImportI18nKey.FileError) || '',
        invalid: true,
        extension: '',
      });
    }
  });
  return data;
};

/**
 * Generate columns for export grid
 *
 * @param {(value: string, key: string, field: string) => void} onChange - function for changing grid data
 * @returns {ColDef[]} - column definitions
 */
export const generateAssetColumnsForImportGrid = (
  onChange: (value: string, data: unknown, field: string) => void,
  withIcon?: boolean,
  readonly?: boolean,
): ColDef[] => {
  return [
    {
      headerName: 'Name',
      field: 'assetName',
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams) => {
        return !params.data.invalid && !readonly ? { component: EditableCellRenderer } : void 0;
      },
      cellRendererParams: {
        onChange,
      },
    },
    {
      headerName: 'Version',
      field: 'version',
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams) => {
        return !params.data.invalid && !readonly ? { component: EditableCellRenderer } : void 0;
      },
      cellRendererParams: { onChange },
    },
    {
      headerName: 'File',
      field: 'name',
      cellRendererSelector: () => {
        return withIcon ? { component: FileNameCellRenderer } : void 0;
      },
    },
  ];
};

/**
 * Generate columns for DialFile export grid
 *
 * @param {(value: string, key: string, field: string) => void} onChange - function for changing grid data
 * @returns {ColDef[]} - column definitions
 */
export const generateFileColumnsForImportGrid = (
  onChange: (value: string, key: string, field: string) => void,
  withIcon?: boolean,
  readonly?: boolean,
): ColDef[] => {
  return [
    {
      headerName: 'Name',
      field: 'fileName',
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams) => {
        if (!params.data.invalid && !readonly) {
          return { component: EditableCellRenderer };
        } else {
          return void 0;
        }
      },
      cellRendererParams: {
        onChange,
      },
    },
    {
      headerName: 'File',
      field: 'name',
      cellRendererSelector: () => {
        if (withIcon) {
          return { component: FileNameCellRenderer };
        } else {
          return void 0;
        }
      },
    },
  ];
};

/**
 * Check row data for errors
 *
 * @param {AssetImportGridData} data - row data
 * @returns {boolean} - true if DialPrompt with same name and version from row already exists
 */
export const isErrorPromptNode = (data: AssetImportGridData): boolean => {
  const version = data.version;
  const name = data.assetName;
  const existingPrompts = data.existingNames as string[];
  return existingPrompts.some((p) => p === generateNameVersionForPrompt(name, version));
};

/**
 * Checks whether imported files have names that already exist
 *
 * @param {FileImportGridData} data - file for import
 * @returns {boolean} - return true if file with same name+extension already exists
 */
export const isErrorFileNode = (data: FileImportGridData): boolean => {
  const name = data.fileName;
  const extension = data.extension;
  const existingPrompts = data.existingNames as string[];
  return existingPrompts.some((p) => p === `${name}${extension}`);
};

/**
 * Check importing prompts with given regexp
 *
 * @param {ParsedAssets} parsedData - parsed Assets
 * @returns {boolean} - return true if prompts id is not valid
 */
export const isInvalidJson = (parsedData: ParsedAssets, view?: ApplicationRoute) => {
  let values;

  if (view === ApplicationRoute.Prompts) {
    values = parsedData.prompts;
  }

  if (view === ApplicationRoute.AssetsApplications) {
    values = parsedData.applications;
  }

  if (view === ApplicationRoute.AssetsToolsets) {
    values = parsedData?.toolSets;
  }

  if (!values || values.length === 0 || !(values instanceof Array)) {
    return true;
  }

  return view === ApplicationRoute.Prompts
    ? !/^prompts\/public\/([^/]+\/)*[^/]+__[^/]+$/.test(values[0].id as string)
    : false;
};

/**
 * Check file size
 *
 * @param {File} file - file
 * @returns {boolean} - true if filesize > 512 mB (core restriction)
 */
export const isLargeFile = (file: File) => {
  const maxSize = 512 * 1024 * 1024;
  return file.size >= maxSize;
};

/**
 * Function for modifying export files map, to apply name, version changes
 *
 * @param {Map<string, FileImportMap>} prev - files or prompts map
 * @param {AssetImportGridData | FileImportGridData} data - row data
 * @param {string} field - field key for update
 * @param {string} value - new value
 * @returns {Map<string, FileImportMap>} - modified DialPrompt or DialFile map
 */
export const changeFilesMap = (
  prev: Map<string, FileImportMap>,
  data: AssetImportGridData | FileImportGridData,
  field: string,
  value: string,
  view?: ApplicationRoute,
): Map<string, FileImportMap> => {
  const newMap = new Map(prev);
  const fileIndex = data.index;
  const key = data.name;
  const currentValue = prev.get(key);
  if (currentValue) {
    const updatedValue = { ...currentValue };
    updatedValue.files = [...currentValue.files];

    const targetFile = updatedValue.files[fileIndex];

    if (view === ApplicationRoute.Prompts || view === ApplicationRoute.Files) {
      if (targetFile) {
        if (field === 'version') {
          targetFile.id = modifyNameVersionInPrompt((targetFile.id || targetFile.name) as string, void 0, value);
        } else if (field === 'assetName') {
          targetFile.id = modifyNameVersionInPrompt((targetFile.id || targetFile.name) as string, value);
          targetFile.name = value;
        } else if (field === 'fileName') {
          const { extension } = getNameExtensionFromFile(key);

          const newFile = new File([targetFile as unknown as BlobPart], `${value}${extension}`, {
            type: (targetFile as unknown as File).type,
          });

          updatedValue.files[fileIndex] = newFile as unknown as DialFile;
        }
      }
    } else {
      if (field === 'version') {
        (targetFile as AssetApp).version = value;
        (targetFile as AssetApp).displayVersion = value;
      } else if (field === 'name') {
        targetFile.name = value;
      }
    }

    newMap.set(key, updatedValue);
  }
  return newMap;
};

export const getModalTitle = (route: ApplicationRoute | undefined, t: (t: string) => string) => {
  switch (route) {
    case ApplicationRoute.Prompts:
      return t(PromptsI18nKey.Import);
    case ApplicationRoute.Files:
      return t(FoldersI18nKey.Import);
    case ApplicationRoute.AssetsApplications:
      return t(ApplicationsI18nKey.Import);
    case ApplicationRoute.AssetsToolsets:
      return t(ToolsetI18nKey.Import);
    default:
      return '';
  }
};

import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import {
  generateNameVersionForPrompt,
  getNameVersionFromPrompt,
  modifyNameVersionInPrompt,
} from '@/src/utils/prompts/versions';
import { NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { ImportI18nKey } from '@/src/constants/i18n';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ImportResult } from '@/src/models/import';
import { Notification } from '@/src/models/notification';
import { ParsedPrompts, PromptImportGridData } from '@/src/models/prompts';
import { StepStatus } from '@/src/models/step';
import { ImportStatus } from '@/src/types/import';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import FileNameCellRenderer from '@/src/components/Grid/CellRenderers/FileNameCellRenderer';

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
  showNotification: (config: Notification) => string,
) => {
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
    if (result.status === ImportStatus.ERROR) {
      failed.push(result.targetPath);
    }
  });

  if (success > 0) {
    showNotification(
      getSuccessNotification(
        t(ImportI18nKey.ImportSuccessTitle, { number: success, type }),
        t(ImportI18nKey.ImportSuccessDescription, { folder: folderName }),
      ),
    );
  }
  if (failed.length > 0) {
    showNotification(
      getErrorNotification(
        t(ImportI18nKey.ImportErrorTitle, { number: failed.length, type }),
        `${t(ImportI18nKey.ImportErrorDescription)}\n${failed.join('\n')}`,
      ),
    );
  }
  if (skipped.length > 0) {
    showNotification(
      getErrorNotification(
        t(ImportI18nKey.ImportSkipTitle, { number: skipped.length, type }),
        `${t(ImportI18nKey.ImportSkipDescription)}\n${skipped.join('\n')}`,
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
export const getMultipleImportStatus = (map: Map<string, FileImportMap>): StepStatus => {
  const files = Array.from(map.values());
  if (files.length === 0) {
    return StepStatus.INVALID;
  } else if (files.some((value) => value.isInvalid)) {
    return StepStatus.ERROR;
  }
  return StepStatus.VALID;
};

/**
 * Convert selected for import DialPrompt data into grid data with errors
 *
 * @param {Map<string, FileImportMap>} editedFileMap - DialPrompt map for import
 * @param {?DialPrompt[]} [existingPrompts] - array of already existing in current folder Prompts
 * @returns {PromptImportGridData[]} - array of PromptImportGridData
 */
export const generatePromptRowDataForImportGrid = (
  editedFileMap: Map<string, FileImportMap>,
  existingPrompts?: DialPrompt[],
  t?: (t: string) => string,
): PromptImportGridData[] => {
  const data: PromptImportGridData[] = [];

  editedFileMap.forEach((value, key) => {
    const { extension } = getNameExtensionFromFile(key);
    if (!value.isInvalid) {
      value.files.forEach((file, index) => {
        const fullName = getFolderNameAndPath(file.id as string).name;
        const { name: promptName, version } = getNameVersionFromPrompt(fullName);

        data.push({
          index,
          name: key,
          version,
          promptName,
          existingNames: existingPrompts?.map((p) => getFolderNameAndPath(p.path).name),
          extension,
        });
      });
    } else {
      data.push({
        index: 0,
        name: key,
        version: '',
        promptName: t?.(ImportI18nKey.ImportPromptError) || '',
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
        fileName: t?.(ImportI18nKey.ImportFileError) || '',
        invalid: true,
        extension: '',
      });
    }
  });
  return data;
};

/**
 * Generate columns for DialPrompt export grid
 *
 * @param {(value: string, key: string, field: string) => void} onChange - function for changing grid data
 * @returns {ColDef[]} - column definitions
 */
export const generatePromptColumnsForImportGrid = (
  onChange: (value: string, data: unknown, field: string) => void,
  withIcon?: boolean,
  readonly?: boolean,
): ColDef[] => {
  return [
    {
      headerName: 'Name',
      field: 'promptName',
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
      headerName: 'Version',
      field: 'version',
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
 * @param {PromptImportGridData} data - row data
 * @returns {boolean} - true if DialPrompt with same name and version from row already exists
 */
export const isErrorPromptNode = (data: PromptImportGridData): boolean => {
  const version = data.version;
  const name = data.promptName;
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
 * @param {ParsedPrompts} parsedData - parsed DialPrompt
 * @returns {boolean} - return true if prompts id is not valid
 */
export const isInvalidJson = (parsedData: ParsedPrompts) => {
  return (
    !parsedData?.prompts ||
    parsedData?.prompts.length === 0 ||
    !/^prompts\/public\/([^/]+\/)*[^/]+__[^/]+$/.test(parsedData?.prompts[0].id as string)
  );
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
 * @param {PromptImportGridData | FileImportGridData} data - row data
 * @param {string} field - field key for update
 * @param {string} value - new value
 * @returns {Map<string, FileImportMap>} - modified DialPrompt or DialFile map
 */
export const changeFilesMap = (
  prev: Map<string, FileImportMap>,
  data: PromptImportGridData | FileImportGridData,
  field: string,
  value: string,
): Map<string, FileImportMap> => {
  const newMap = new Map(prev);
  const fileIndex = data.index;
  const key = data.name;
  const currentValue = prev.get(key);
  if (currentValue) {
    const updatedValue = { ...currentValue };
    updatedValue.files = [...currentValue.files];

    const targetFile = updatedValue.files[fileIndex];

    if (targetFile) {
      if (field === 'version') {
        targetFile.id = modifyNameVersionInPrompt(targetFile.id as string, void 0, value);
      } else if (field === 'promptName') {
        targetFile.id = modifyNameVersionInPrompt(targetFile.id as string, value);
        targetFile.name = value;
      } else if (field === 'fileName') {
        const { extension } = getNameExtensionFromFile(key);

        const newFile = new File([targetFile as unknown as BlobPart], `${value}${extension}`, {
          type: (targetFile as unknown as File).type,
        });

        updatedValue.files[fileIndex] = newFile as unknown as DialFile;
      }
    }

    newMap.set(key, updatedValue);
  }
  return newMap;
};

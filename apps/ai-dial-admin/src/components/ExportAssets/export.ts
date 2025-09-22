import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';

/**
 * Converts array of DialPrompt into correct row data, joining multiple versions of prompts into one
 *
 * @param {DialPrompt[]} prompts - DialPrompt array
 * @param {?DialPrompt[]} [exportedPrompts] - DialPrompt array of already selected for import
 * @returns {DialPrompt[]} - DialPrompt array
 */
export const generatePromptRowDataForExportGrid = (
  prompts: DialPrompt[],
  exportedPrompts?: DialPrompt[],
): DialPrompt[] => {
  const promptMap = prompts?.reduce((map, prompt) => {
    const exported = exportedPrompts?.filter((p) => p.name === prompt.name);
    const isAddVersion = exported?.some((p) => p.version === prompt.version);

    const existingPrompt = map.get(prompt.name as string);
    if (existingPrompt) {
      existingPrompt.versions?.push(prompt.version);
      if (isAddVersion) {
        existingPrompt.version = existingPrompt.version
          ? `${existingPrompt.version}, ${prompt.version}`
          : prompt.version;
      } else {
        existingPrompt.version = exported?.length ? existingPrompt.version : prompt.version;
      }
    } else {
      map.set(prompt.name as string, {
        ...prompt,
        version: exported?.length && !isAddVersion ? '' : prompt.version,
        versions: [prompt.version],
      });
    }

    return map;
  }, new Map<string, DialPrompt>());

  return promptMap ? Array.from(promptMap.values()) : [];
};

/**
 * Generic function which handles selection items in grid for export
 *
 * @template {DialFile | DialPrompt} T - type of items for export
 * @param {T[]} selectedItems - array of selected items
 * @param {Record<string, T[]>} fetchedFoldersData - correct data which should be added for export
 * @param {string} filePath - current folder path
 * @param {Record<string, T[]>} exportedData - array of already selected items for export
 * @param {(item: T, fetchedItems: T[]) => T[]} finder - function to find correct data, based on selected rows
 * @returns {Record<string, T[]>} - export data map
 */
export const changeExportData = <T extends DialFile | DialPrompt>(
  selectedItems: T[],
  fetchedFoldersData: Record<string, T[]>,
  filePath: string,
  exportedData: Record<string, T[]>,
  finder: (item: T, fetchedItems: T[]) => T[],
): Record<string, T[]> => {
  const result: Record<string, T[]> = { ...exportedData };

  if (selectedItems.length) {
    const fetched: T[] = [];
    const fetchedItems = fetchedFoldersData[filePath] || [];
    selectedItems.forEach((item) => {
      const matches = finder(item, fetchedItems);
      fetched.push(...matches);
    });
    result[filePath] = fetched;
  } else {
    delete result[filePath];
  }

  return result;
};

/**
 * Function which generate correct data for exporting prompts
 *
 * @param {DialPrompt[]} selectedPrompts - array of selected prompts
 * @param {Record<string, DialPrompt[]>} fetchedFoldersData - correct data which should be added for export
 * @param {string} filePath - current folder path
 * @param {Record<string, DialPrompt[]>} exportedPrompts  - array of already selected items for export
 * @returns {Record<string, DialPrompt[]>} - export DialPrompt map
 */
export const changeExportPromptData = (
  selectedPrompts: DialPrompt[],
  fetchedFoldersData: Record<string, DialPrompt[]>,
  filePath: string,
  exportedPrompts: Record<string, DialPrompt[]>,
): Record<string, DialPrompt[]> => {
  return changeExportData<DialPrompt>(
    selectedPrompts,
    fetchedFoldersData,
    filePath,
    exportedPrompts,
    findPromptVersions,
  );
};

/**
 * Function which generate correct data for exporting files
 *
 * @param {DialFile[]} selectedFiles - array of selected files
 * @param {Record<string, DialFile[]>} fetchedFoldersData - correct data which should be added for export
 * @param {string} filePath - current folder path
 * @param {Record<string, DialFile[]>} exportedFiles - array of already selected items for export
 * @returns {Record<string, DialFile[]>} - export DialFile map
 */
export const changeExportFileData = (
  selectedFiles: DialFile[],
  fetchedFoldersData: Record<string, DialFile[]>,
  filePath: string,
  exportedFiles: Record<string, DialFile[]>,
) => {
  return changeExportData<DialFile>(selectedFiles, fetchedFoldersData, filePath, exportedFiles, findFileMatch);
};

/**
 * Function which find all selected prompt version for export
 *
 * @param {DialPrompt} prompt - selected DialPrompt
 * @param {DialPrompt[]} fetched - all prompts from folder
 * @returns {DialPrompt[]} - DialPrompt array with all selected version
 */
export const findPromptVersions = (prompt: DialPrompt, fetched: DialPrompt[]): DialPrompt[] => {
  const versions = prompt.version.split(STRINGS_DELIMITER);
  return versions
    .map((version) => fetched.find((p) => p.name === prompt.name && p.version === version) as DialPrompt)
    .filter(Boolean);
};

/**
 * Function which find selected file based on name and extension
 *
 * @param {DialFile} file - selected DialFile
 * @param {DialFile[]} fetched - all files from folder
 * @returns {DialFile[]} - DialFile array
 */
export const findFileMatch = (file: DialFile, fetched: DialFile[]): DialFile[] => {
  const match = fetched.find((f) => f.name === `${file.name}${file.extension}`);
  return match ? [match] : [];
};

/**
 * Generate export prompt array of paths
 *
 * @param {?Record<string, DialFile[]>} [promptsToExport] - array of DialPrompt for export
 * @returns {string[]} - array of DialPrompt path string
 */
export const generateExportList = (promptsToExport?: Record<string, DialFile[]>): string[] => {
  const result: string[] = [];
  for (const folder in promptsToExport) {
    promptsToExport[folder].forEach((prompt) => result.push(prompt.path));
  }
  return result;
};

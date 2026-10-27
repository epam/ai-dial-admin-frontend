import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { getGridFileData } from '@/src/utils/files/grid-data';
import { isAssetWithVersion, isVersionlessAssetView } from '@/src/utils/is-view';

/** Every stored path remains an independent export row. */
export const generateRowDataForExportGrid = (
  assets: AssetWithVersion[] = [],
  _exportedAssets?: AssetWithVersion[],
): AssetWithVersion[] => assets;

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
 * Function which generate correct data for exporting assets
 *
 * @param {AssetWithVersion[]} selectedAsset - array of selected assets
 * @param {Record<string, AssetWithVersion[]>} fetchedFoldersData - correct data which should be added for export
 * @param {string} filePath - current folder path
 * @param {Record<string, AssetWithVersion[]>} exportedAsset  - array of already selected items for export
 * @returns {Record<string, AssetWithVersion[]>} - export Asset map
 */
export const changeExportAssetData = (
  selectedAsset: AssetWithVersion[],
  fetchedFoldersData: Record<string, AssetWithVersion[]>,
  filePath: string,
  exportedAsset: Record<string, AssetWithVersion[]>,
): Record<string, AssetWithVersion[]> => {
  return changeExportData<AssetWithVersion>(selectedAsset, fetchedFoldersData, filePath, exportedAsset, findAssetMatch);
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

/** Resolves only the explicitly selected complete resource path. */
export const findAssetMatch = (asset: AssetWithVersion, fetched: AssetWithVersion[]): AssetWithVersion[] => {
  const match = fetched.find((item) => item.path === asset.path);
  return match ? [match] : [];
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
 * Function which find selected versionless prompt based on its unique plain path
 *
 * @param {DialPrompt} prompt - selected prompt
 * @param {DialPrompt[]} fetched - all prompts from folder
 * @returns {DialPrompt[]} - DialPrompt array with the matching prompt
 */
export const findPromptMatch = (prompt: DialPrompt, fetched: DialPrompt[]): DialPrompt[] => {
  const match = fetched.find((p) => p.path === prompt.path);
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

/**
 * Generate row data for export grid based on route
 *
 * @param {?ApplicationRoute} [route] - application route
 * @param {?(DialPrompt | DialFile)[]} [fetched] - fetched data for selected folder
 * @param {?(DialPrompt | DialFile)[]} [selected] - already selected data for selected folder
 * @returns {(DialPrompt | DialFile)[]} - array of export data
 */
export const getExportGridData = (
  route?: ApplicationRoute,
  fetched?: (DialPrompt | DialFile)[],
  selected?: (DialPrompt | DialFile)[],
): (DialPrompt | DialFile)[] => {
  if (isAssetWithVersion(route)) {
    return generateRowDataForExportGrid(fetched as AssetWithVersion[], selected as AssetWithVersion[]);
  }

  if (isVersionlessAssetView(route)) {
    // A versionless prompt is a single stored resource — each fetched prompt is its own row,
    // with no same-name version merging (grid row selection tracks what is exported).
    return (fetched as DialPrompt[]) || [];
  }

  if (route === ApplicationRoute.Files) {
    return getGridFileData(fetched as DialFile[]);
  }

  return [];
};

/**
 * Generate changed export grid data base on route
 *
 * @param {?ApplicationRoute} [route] - application route
 * @param {?Record<string, (DialPrompt | DialFile)[]>} [fetched] - fetched data for selected folder
 * @param {?Record<string, (DialPrompt | DialFile)[]>} [selected] - already selected data for selected folder
 * @param {?(DialPrompt | DialFile)[]} [selectedRows] - selected rows from grid
 * @param {?string} [filePath] - current folder path
 * @returns {Record<string, DialPrompt[]>} - array of export data
 */
export const changeExportGridData = (
  route?: ApplicationRoute,
  fetched?: Record<string, (AssetWithVersion | DialFile | DialPrompt)[]>,
  selected?: Record<string, (AssetWithVersion | DialFile | DialPrompt)[]>,
  selectedRows?: (DialPrompt | DialFile)[],
  filePath?: string,
): Record<string, (AssetWithVersion | DialFile | DialPrompt)[]> => {
  if (isAssetWithVersion(route)) {
    return changeExportAssetData(
      selectedRows as AssetWithVersion[],
      fetched as Record<string, AssetWithVersion[]>,
      filePath as string,
      selected as Record<string, AssetWithVersion[]>,
    );
  }

  if (isVersionlessAssetView(route)) {
    return changeExportData<DialPrompt>(
      selectedRows as DialPrompt[],
      fetched as Record<string, DialPrompt[]>,
      filePath as string,
      selected as Record<string, DialPrompt[]>,
      findPromptMatch,
    );
  }

  if (route === ApplicationRoute.Files) {
    return changeExportFileData(
      selectedRows as DialFile[],
      fetched as Record<string, DialFile[]>,
      filePath as string,
      selected as Record<string, DialFile[]>,
    );
  }
  return {};
};

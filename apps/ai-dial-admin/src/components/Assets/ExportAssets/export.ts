import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { getGridFileData } from '@/src/utils/files/grid-data';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { Asset } from '@/src/models/dial/deployment-asset';

/**
 * Converts array of Assets into correct row data, joining multiple versions of prompts into one
 *
 * @param {Asset[]} assets - Asset array
 * @param {?Asset[]} [exportedAssets] - Asset array of already selected for import
 * @returns {Asset[]} - Asset array
 */
export const generateRowDataForExportGrid = (assets: Asset[], exportedAssets?: Asset[]): Asset[] => {
  const assetMap = assets?.reduce((map, asset) => {
    const exported = exportedAssets?.filter((p) => p.name === asset.name);
    const isAddVersion = exported?.some((p) => p.version === asset.version);

    const existingAsset = map.get(asset.name as string);
    if (existingAsset) {
      existingAsset.versions?.push(asset.version);
      if (isAddVersion) {
        existingAsset.version = existingAsset.version ? `${existingAsset.version}, ${asset.version}` : asset.version;
      } else {
        existingAsset.version = exported?.length ? existingAsset.version : asset.version;
      }
    } else {
      map.set(asset.name as string, {
        ...asset,
        version: exported?.length && !isAddVersion ? '' : asset.version,
        versions: [asset.version],
      });
    }

    return map;
  }, new Map<string, Asset>());

  return assetMap ? Array.from(assetMap.values()) : [];
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
 * Function which generate correct data for exporting assets
 *
 * @param {Asset[]} selectedAsset - array of selected assets
 * @param {Record<string, Asset[]>} fetchedFoldersData - correct data which should be added for export
 * @param {string} filePath - current folder path
 * @param {Record<string, Asset[]>} exportedAsset  - array of already selected items for export
 * @returns {Record<string, Asset[]>} - export Asset map
 */
export const changeExportAssetData = (
  selectedAsset: Asset[],
  fetchedFoldersData: Record<string, Asset[]>,
  filePath: string,
  exportedAsset: Record<string, Asset[]>,
): Record<string, Asset[]> => {
  return changeExportData<Asset>(selectedAsset, fetchedFoldersData, filePath, exportedAsset, findAssetVersions);
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
 * Function which find all selected asset version for export
 *
 * @param {Asset} asset - selected Asset
 * @param {Asset[]} fetched - all assets from folder
 * @returns {Asset[]} - Asset array with all selected version
 */
export const findAssetVersions = (asset: Asset, fetched: Asset[]): Asset[] => {
  const versions = asset.version.split(STRINGS_DELIMITER);
  return versions
    .map((version) => fetched.find((p) => p.name === asset.name && p.version === version) as Asset)
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
    return generateRowDataForExportGrid(fetched as DialPrompt[], selected as DialPrompt[]);
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
  fetched?: Record<string, (Asset | DialFile)[]>,
  selected?: Record<string, (Asset | DialFile)[]>,
  selectedRows?: (DialPrompt | DialFile)[],
  filePath?: string,
): Record<string, Asset[]> => {
  if (isAssetWithVersion(route)) {
    return changeExportAssetData(
      selectedRows as Asset[],
      fetched as Record<string, Asset[]>,
      filePath as string,
      selected as Record<string, Asset[]>,
    );
  }

  if (route === ApplicationRoute.Files) {
    return changeExportFileData(
      selectedRows as DialFile[],
      fetched as Record<string, DialFile[]>,
      filePath as string,
      selected as Record<string, DialFile[]>,
    ) as Record<string, DialPrompt[]>;
  }
  return {};
};

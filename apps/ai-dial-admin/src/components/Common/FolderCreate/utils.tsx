import { ColDef } from 'ag-grid-community';

import {
  generateFileColumnsForImportGrid,
  generateAssetColumnsForImportGrid,
  isInvalidJson,
  isLargeFile,
} from '@/src/components/EntityListView/Import/utils';
import { DialFile } from '@/src/models/dial/file';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ParsedAssets, AssetImportGridData } from '@/src/models/import-asset';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { ZipFilePreview } from './models';
import { isAssetWithVersion } from '@/src/utils/is-view';

/**
 * Check is import data preview has errors
 *
 * @param {AssetImportGridData} data - import data
 * @returns {boolean} - return true if has errors
 */
export const isErrorAssetReview = (data: AssetImportGridData): boolean => {
  return !data.version || !data.assetName || !!data.invalid;
};

/**
 *  Check is import file preview has errors
 *
 * @param {FileImportGridData} data - files
 * @returns {boolean} - return true if has errors
 */
export const isErrorFileReview = (data: FileImportGridData): boolean => {
  return !data.name || !!data.invalid;
};

/**
 * Read prompts and check validity
 *
 * @async
 * @param {File[]} files - prompts
 * @param {?ApplicationRoute} [route] - route
 * @returns {Promise<Map<string, FileImportMap>>} - mapping file name and all prompts related to this file, tagged with validity flag
 */

export const readJsonFiles = async (files: File[], route?: ApplicationRoute): Promise<Map<string, FileImportMap>> => {
  const results = new Map<string, FileImportMap>();

  const readFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const parsedData: ParsedAssets = JSON.parse(reader.result as string);
          const isInvalid = isInvalidJson(parsedData, route);
          results.set(file.name, {
            files: parsedData?.prompts || parsedData?.applications || parsedData?.toolSets || [],
            isInvalid,
          });
        } catch (error) {
          console.error('Error parsing JSON:', error);
          results.set(file.name, { files: [], isInvalid: true });
        }
        resolve();
      };

      reader.onerror = () => {
        console.error('Error reading file:', file.name);
        results.set(file.name, { files: [], isInvalid: true });
        resolve();
      };

      reader.readAsText(file);
    });
  };
  await Promise.all(files.map(readFile));
  return results;
};

/**
 * Read files and check validity
 *
 * @param {File[]} files - files
 * @returns {Map<string, FileImportMap>} - mapping file name with validity flag
 */
export const readAllFiles = (files: File[]): Map<string, FileImportMap> => {
  const results = new Map<string, FileImportMap>();
  files.map((file) => {
    const isInvalid = isLargeFile(file);
    results.set(file.name, { files: [file] as unknown as DialFile[], isInvalid });
  });
  return results;
};

/**
 * Check prompts preview and generate list of prompts name+version
 *
 * @param {ZipFilePreview[]} preview - zip file preview with prompts
 * @returns {Map<string, FileImportMap>} - mapping with filename as key, and list of prompts as value
 */
export const generatePreviewData = (preview: ZipFilePreview[]): Map<string, FileImportMap> => {
  const resultMap = new Map();

  preview.forEach(({ fileName, name, version }) => {
    const file = getFolderNameAndPath(fileName).name;
    const id = `${name}__${version}`;

    if (!resultMap.has(file)) {
      resultMap.set(file, { files: [{ id }], isInvalid: false });
    } else {
      resultMap.get(file).files.push({ id });
    }
  });

  return resultMap;
};

/**
 * Generate columns for import grid base on route
 *
 * @param {(value: string, data: unknown, field: string) => void} changeFileFunc - function for file change
 * @param {string} fileType - file type
 * @param {?ApplicationRoute} [route] - route
 * @returns {ColDef[]} - columns for grid
 */
export const generateColumnsForImportGrid = (
  changeFileFunc: (value: string, data: unknown, field: string) => void,
  fileType: string,
  route?: ApplicationRoute,
): ColDef[] => {
  if (isAssetWithVersion(route)) {
    return generateAssetColumnsForImportGrid(changeFileFunc, true, fileType === ImportFileType.ARCHIVE);
  }
  if (route === ApplicationRoute.Files) {
    return generateFileColumnsForImportGrid(changeFileFunc, true, fileType === ImportFileType.ARCHIVE);
  }
  return [];
};

/**
 * Check if import data has errors
 *
 * @param {(AssetImportGridData | FileImportGridData)} data - import data
 * @param {?ApplicationRoute} [route] - route
 * @returns {boolean} - return true if errors exist
 */
export const isErrorRowForImport = (
  data: AssetImportGridData | FileImportGridData,
  route?: ApplicationRoute,
): boolean => {
  if (isAssetWithVersion(route)) {
    return isErrorAssetReview(data as AssetImportGridData);
  }
  if (route === ApplicationRoute.Files) {
    return isErrorFileReview(data as FileImportGridData);
  }
  return false;
};

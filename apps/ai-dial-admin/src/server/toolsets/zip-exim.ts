/**
 * Zip wrap/unwrap for the toolset export/import JSON document, ported from
 * `ZipToolSetEximService`. The actual zip logic is the generic
 * `src/server/assets/zip-exim.ts`, shared with prompts/applications; this file only supplies
 * the toolset-specific config.
 */

import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ParsedAssets } from '@/src/models/import-asset';
import {
  InvalidAssetZipError,
  ZipEximConfig,
  buildAssetZip,
  extractAssetsFromZip,
  mergeAssetExports,
} from '@/src/server/assets/zip-exim';

export const TOOLSETS_ZIP_PREFIX = 'toolSets/';
export const TOOLSETS_ZIP_ENTRY = 'toolSets/toolSets.json';
export { InvalidAssetZipError as InvalidToolsetsZipError };

const TOOLSETS_ZIP_CONFIG: ZipEximConfig<AssetToolset> = {
  entryPrefix: TOOLSETS_ZIP_PREFIX,
  entryFileName: TOOLSETS_ZIP_ENTRY,
  getEntities: (document) => document.toolSets,
  setEntities: (toolSets) => ({ toolSets }),
};

/** Wraps a `{ toolSets: AssetToolset[] }` document as a single-entry zip. */
export const buildToolsetsZip = (document: ParsedAssets): Promise<Blob> => buildAssetZip(TOOLSETS_ZIP_CONFIG, document);

/**
 * Merges multiple `{ toolSets: AssetToolset[] }` documents into one, rejecting an id that
 * repeats across documents — matching the BE's in-archive-conflict check.
 */
export const mergeToolsetsExports = (documents: ParsedAssets[]): ParsedAssets =>
  mergeAssetExports(TOOLSETS_ZIP_CONFIG, documents);

/**
 * Unpacks every `toolSets/*.json` entry from an uploaded zip archive (path-traversal-guarded
 * the same way as Files/Prompts' zip import) and merges them into one import document.
 */
export const extractToolsetsFromZip = (zipBuffer: ArrayBuffer): Promise<ParsedAssets> =>
  extractAssetsFromZip(TOOLSETS_ZIP_CONFIG, zipBuffer);

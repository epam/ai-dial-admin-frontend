/**
 * Zip wrap/unwrap for the application export/import JSON document, ported from the admin
 * backend's application-specific zip export/import service. The actual zip logic is the
 * generic `src/server/assets/zip-exim.ts`, shared with prompts/toolsets; this file only
 * supplies the application-specific config.
 */

import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ParsedAssets } from '@/src/models/import-asset';
import {
  InvalidAssetZipError,
  ZipEximConfig,
  buildAssetZip,
  extractAssetsFromZip,
  mergeAssetExports,
} from '@/src/server/assets/zip-exim';

export const APPLICATIONS_ZIP_PREFIX = 'applications/';
export const APPLICATIONS_ZIP_ENTRY = 'applications/applications.json';
export { InvalidAssetZipError as InvalidApplicationsZipError };

const APPLICATIONS_ZIP_CONFIG: ZipEximConfig<AssetApp> = {
  entryPrefix: APPLICATIONS_ZIP_PREFIX,
  entryFileName: APPLICATIONS_ZIP_ENTRY,
  getEntities: (document) => document.applications,
  setEntities: (applications) => ({ applications }),
};

/** Wraps a `{ applications: AssetApp[] }` document as a single-entry zip. */
export const buildApplicationsZip = (document: ParsedAssets): Promise<Blob> =>
  buildAssetZip(APPLICATIONS_ZIP_CONFIG, document);

/**
 * Merges multiple `{ applications: AssetApp[] }` documents into one, rejecting an id that
 * repeats across documents — matching the BE's in-archive-conflict check.
 */
export const mergeApplicationsExports = (documents: ParsedAssets[]): ParsedAssets =>
  mergeAssetExports(APPLICATIONS_ZIP_CONFIG, documents);

/**
 * Unpacks every `applications/*.json` entry from an uploaded zip archive (path-traversal-
 * guarded the same way as Files/Prompts/Toolsets' zip import) and merges them into one
 * import document.
 */
export const extractApplicationsFromZip = (zipBuffer: ArrayBuffer): Promise<ParsedAssets> =>
  extractAssetsFromZip(APPLICATIONS_ZIP_CONFIG, zipBuffer);

/**
 * Application JSON import/export, ported from the admin backend's `ApplicationEximService`.
 * Applications carry no credential-like fields, so unlike toolsets there is nothing to
 * consider redacting on export either way. The actual build/import logic is the generic
 * `src/server/assets/exim.ts`, shared with prompts/toolsets; this file only supplies the
 * application-specific config.
 */

import { Token } from '@/src/models/auth';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ParsedAssets } from '@/src/models/import-asset';
import { AssetApi } from '@/src/server/core/asset-api';
import { AssetEximConfig, ImportAssetsOptions, buildAssetsExport, importAssetsExport } from '@/src/server/assets/exim';
import { ResourceType } from '@/src/types/resource-type';

export { resolveImportDestination } from '@/src/server/assets/import-destination';
export type ImportApplicationsOptions = ImportAssetsOptions;

const APPLICATIONS_EXIM_CONFIG: AssetEximConfig<AssetApp> = {
  resourceType: ResourceType.APPLICATION,
  getEntities: (document) => document.applications,
  setEntities: (applications) => ({ applications }),
};

/** Builds the `{ applications: AssetApp[] }` export document directly from DIAL Core. */
export const buildApplicationsExport = (assetApi: AssetApi, token: Token, paths: string[]): Promise<ParsedAssets> =>
  buildAssetsExport(APPLICATIONS_EXIM_CONFIG, assetApi, token, paths);

/** Imports a `{ applications: AssetApp[] }` document directly against DIAL Core. */
export const importApplicationsExport = (
  assetApi: AssetApi,
  token: Token,
  document: ParsedAssets,
  options: ImportAssetsOptions,
) => importAssetsExport(APPLICATIONS_EXIM_CONFIG, assetApi, token, document, options);

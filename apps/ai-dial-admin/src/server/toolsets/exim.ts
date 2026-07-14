/**
 * Toolset JSON import/export, ported from the admin backend's `ToolSetEximService`. No
 * secret redaction is applied to `authSettings` on export: the admin backend's own export
 * doesn't redact them either, and this port preserves that behavior rather than fixing it
 * (an explicit decision, not an oversight — see `migrate-toolset-auth-discovery-import-to-core`).
 * The actual build/import logic is the generic `src/server/assets/exim.ts`, shared with
 * prompts/applications; this file only supplies the toolset-specific config.
 */

import { Token } from '@/src/models/auth';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ParsedAssets } from '@/src/models/import-asset';
import { AssetApi } from '@/src/server/core/asset-api';
import { AssetEximConfig, ImportAssetsOptions, buildAssetsExport, importAssetsExport } from '@/src/server/assets/exim';
import { ResourceType } from '@/src/types/resource-type';

export { resolveImportDestination } from '@/src/server/assets/import-destination';
export type ImportToolsetsOptions = ImportAssetsOptions;

const TOOLSETS_EXIM_CONFIG: AssetEximConfig<AssetToolset> = {
  resourceType: ResourceType.TOOLSET,
  getEntities: (document) => document.toolSets,
  setEntities: (toolSets) => ({ toolSets }),
};

/** Builds the `{ toolSets: AssetToolset[] }` export document directly from DIAL Core. */
export const buildToolsetsExport = (assetApi: AssetApi, token: Token, paths: string[]): Promise<ParsedAssets> =>
  buildAssetsExport(TOOLSETS_EXIM_CONFIG, assetApi, token, paths);

/** Imports a `{ toolSets: AssetToolset[] }` document directly against DIAL Core. */
export const importToolsetsExport = (
  assetApi: AssetApi,
  token: Token,
  document: ParsedAssets,
  options: ImportAssetsOptions,
) => importAssetsExport(TOOLSETS_EXIM_CONFIG, assetApi, token, document, options);

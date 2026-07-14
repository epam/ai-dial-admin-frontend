/**
 * Prompt JSON import/export, ported from the admin backend's `PromptEximService`. The FE
 * already has a live contract for the aggregate document — `ParsedAssets` (`{ prompts:
 * DialPrompt[] }`, `src/models/import-asset.ts`), validated elsewhere by `isInvalidJson` —
 * so this module reuses that shape rather than inventing a new one. The actual build/import
 * logic is the generic `src/server/assets/exim.ts`, shared with toolsets/applications; this
 * file only supplies the prompt-specific config (field name, id regex, `content` default).
 */

import { Token } from '@/src/models/auth';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ParsedAssets } from '@/src/models/import-asset';
import { AssetApi } from '@/src/server/core/asset-api';
import { AssetEximConfig, ImportAssetsOptions, buildAssetsExport, importAssetsExport } from '@/src/server/assets/exim';
import { ResourceType } from '@/src/types/resource-type';

export { resolveImportDestination } from '@/src/server/assets/import-destination';
export type ImportPromptsOptions = ImportAssetsOptions;

const PROMPT_ID_REGEX = /^prompts\/public\/([^/]+\/)*[^/]+__[^/]+$/;

export const isValidPromptExportId = (id?: string): boolean => {
  return typeof id === 'string' && PROMPT_ID_REGEX.test(id);
};

const PROMPTS_EXIM_CONFIG: AssetEximConfig<DialPrompt> = {
  resourceType: ResourceType.PROMPT,
  getEntities: (document) => document.prompts,
  setEntities: (prompts) => ({ prompts }),
  isValidId: isValidPromptExportId,
  transformForPut: (prompt) => ({ ...prompt, content: prompt.content || '' }),
};

/** Builds the `{ prompts: DialPrompt[] }` export document directly from DIAL Core. */
export const buildPromptsExport = (assetApi: AssetApi, token: Token, paths: string[]): Promise<ParsedAssets> =>
  buildAssetsExport(PROMPTS_EXIM_CONFIG, assetApi, token, paths);

/** Imports a `{ prompts: DialPrompt[] }` document directly against DIAL Core. */
export const importPromptsExport = (
  assetApi: AssetApi,
  token: Token,
  document: ParsedAssets,
  options: ImportAssetsOptions,
) => importAssetsExport(PROMPTS_EXIM_CONFIG, assetApi, token, document, options);

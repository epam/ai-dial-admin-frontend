/**
 * Zip wrap/unwrap for the prompt export/import JSON document, ported from
 * `ZipPromptEximService`: a prompts zip isn't "one entry per prompt," it's a single
 * `prompts/prompts.json` entry holding the same aggregate document JSON export/import use.
 * The actual zip logic is the generic `src/server/assets/zip-exim.ts`, shared with
 * toolsets/applications; this file only supplies the prompt-specific config.
 */

import { DialPrompt } from '@/src/models/dial/prompt';
import { ParsedAssets } from '@/src/models/import-asset';
import {
  InvalidAssetZipError,
  ZipEximConfig,
  buildAssetZip,
  extractAssetsFromZip,
  mergeAssetExports,
} from '@/src/server/assets/zip-exim';

export const PROMPTS_ZIP_PREFIX = 'prompts/';
export const PROMPTS_ZIP_ENTRY = 'prompts/prompts.json';
export { InvalidAssetZipError as InvalidPromptsZipError };

const PROMPTS_ZIP_CONFIG: ZipEximConfig<DialPrompt> = {
  entryPrefix: PROMPTS_ZIP_PREFIX,
  entryFileName: PROMPTS_ZIP_ENTRY,
  getEntities: (document) => document.prompts,
  setEntities: (prompts) => ({ prompts }),
};

/** Wraps a `{ prompts: DialPrompt[] }` document as a single-entry zip. */
export const buildPromptsZip = (document: ParsedAssets): Promise<Blob> => buildAssetZip(PROMPTS_ZIP_CONFIG, document);

/**
 * Merges multiple `{ prompts: DialPrompt[] }` documents into one, rejecting an id that
 * repeats across documents — matching `compactPromptsEximDtos`'s in-archive-conflict check.
 */
export const mergePromptsExports = (documents: ParsedAssets[]): ParsedAssets =>
  mergeAssetExports(PROMPTS_ZIP_CONFIG, documents);

/**
 * Unpacks every `prompts/*.json` entry from an uploaded zip archive (path-traversal-guarded
 * the same way as Files' zip import) and merges them into one import document.
 */
export const extractPromptsFromZip = (zipBuffer: ArrayBuffer): Promise<ParsedAssets> =>
  extractAssetsFromZip(PROMPTS_ZIP_CONFIG, zipBuffer);

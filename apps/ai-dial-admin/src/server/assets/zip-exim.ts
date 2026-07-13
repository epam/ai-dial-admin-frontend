/**
 * Generic zip wrap/unwrap for the aggregate-document JSON import/export, shared by every
 * versioned asset type that needs it (prompts/toolsets/applications): a zip isn't "one entry
 * per entity," it's a single JSON entry (or several, on multi-file zip import) holding the
 * same `{ <field>: T[] }` document JSON export/import use.
 */

import JSZip from 'jszip';

import { ParsedAssets } from '@/src/models/import-asset';
import { isValidZipEntryPathWithPrefix } from '@/src/server/files/zip-import';

export class InvalidAssetZipError extends Error {}

export interface ZipEximConfig<T extends { id?: string }> {
  entryPrefix: string;
  entryFileName: string;
  getEntities: (document: ParsedAssets) => T[] | undefined;
  setEntities: (entities: T[]) => ParsedAssets;
}

/** Wraps a `{ <field>: T[] }` document as a single-entry zip. */
export const buildAssetZip = async <T extends { id?: string }>(
  config: ZipEximConfig<T>,
  document: ParsedAssets,
): Promise<Blob> => {
  const zip = new JSZip();
  zip.file(config.entryFileName, JSON.stringify(document));
  return zip.generateAsync({ type: 'blob' });
};

/**
 * Merges multiple `{ <field>: T[] }` documents into one, rejecting an id that repeats across
 * documents — matching the BE's in-archive-conflict check.
 */
export const mergeAssetExports = <T extends { id?: string }>(
  config: ZipEximConfig<T>,
  documents: ParsedAssets[],
): ParsedAssets => {
  const seen = new Set<string>();
  const entities = documents.flatMap((document) => config.getEntities(document) || []);

  for (const entity of entities) {
    const id = entity.id || '';
    if (seen.has(id)) {
      throw new InvalidAssetZipError(`Duplicate id across archive entries: ${id}`);
    }
    seen.add(id);
  }

  return config.setEntities(entities);
};

/**
 * Unpacks every matching-prefix `*.json` entry from an uploaded zip archive (path-traversal-
 * guarded the same way as Files' zip import) and merges them into one import document.
 */
export const extractAssetsFromZip = async <T extends { id?: string }>(
  config: ZipEximConfig<T>,
  zipBuffer: ArrayBuffer,
): Promise<ParsedAssets> => {
  const zip = await JSZip.loadAsync(zipBuffer);
  const documents: ParsedAssets[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }
    if (!isValidZipEntryPathWithPrefix(entry.name, config.entryPrefix) || !entry.name.endsWith('.json')) {
      continue;
    }
    const content = await entry.async('string');
    documents.push(JSON.parse(content) as ParsedAssets);
  }

  if (documents.length === 0) {
    throw new InvalidAssetZipError('Archive contains no valid entries');
  }

  return mergeAssetExports(config, documents);
};

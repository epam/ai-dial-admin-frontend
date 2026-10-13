/**
 * Generic zip wrap/unwrap for the aggregate-document JSON import/export, shared by every
 * versioned asset type that needs it (prompts/toolsets/applications): a zip isn't "one entry
 * per entity," it's a single JSON entry (or several, on multi-file zip import) holding the
 * same `{ <field>: T[] }` document JSON export/import use.
 */

import { BlobReader, BlobWriter, TextReader, ZipReader, ZipWriter } from '@zip.js/zip.js';

import { ParsedAssets } from '@/src/models/import-asset';
import { isValidZipEntryPathWithPrefix } from '@/src/server/files/zip-import';
import { listSafeFileEntries, readEntryBounded, ZIP_READER_OPTIONS } from '@/src/server/zip/zip-safety';

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
  const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
  await zipWriter.add(config.entryFileName, new TextReader(JSON.stringify(document)));
  return zipWriter.close();
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
  const reader = new ZipReader(new BlobReader(new Blob([zipBuffer])), ZIP_READER_OPTIONS);
  const documents: ParsedAssets[] = [];

  try {
    for (const entry of await listSafeFileEntries(reader)) {
      if (!isValidZipEntryPathWithPrefix(entry.filename, config.entryPrefix) || !entry.filename.endsWith('.json')) {
        continue;
      }
      const content = await (await readEntryBounded(entry)).text();
      documents.push(JSON.parse(content) as ParsedAssets);
    }
  } finally {
    await reader.close();
  }

  if (documents.length === 0) {
    throw new InvalidAssetZipError('Archive contains no valid entries');
  }

  return mergeAssetExports(config, documents);
};

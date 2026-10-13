/**
 * Guards for reading untrusted zip archives with zip.js. Entry-name validation lives in
 * `server/files/zip-import.ts`; this module covers resource exhaustion (entry count, declared and
 * actually-inflated size) and symlink entries. Nothing is ever extracted to the local filesystem —
 * entry content only goes to memory and then to DIAL Core.
 */

import { configure, Entry, FileEntry, ZipReader } from '@zip.js/zip.js';

import { getZipImportLimits } from './limits';

// Server runtime: no browser Web Workers, inflate on the main thread.
configure({ useWebWorkers: false });

export class UnsafeZipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeZipError';
  }
}

/**
 * Reader options shared by every zip import: reject overlapping entries (a zip-bomb construction)
 * and verify CRCs. Filename validation is left to `isValidZipEntryPath*`, which skips unsafe entries
 * instead of failing the whole archive; zip.js's own check would throw on the first one.
 */
export const ZIP_READER_OPTIONS = {
  checkOverlappingEntry: true,
  checkCrc32: true,
  filenameValidation: 'tolerant',
} as const;

const isFileEntry = (entry: Entry): entry is FileEntry => !entry.directory;

/**
 * Lists the file entries of an archive, rejecting it up front when it declares too many entries or
 * too much inflated data, and dropping symlink entries (their "content" is a link target, not a file).
 */
export const listSafeFileEntries = async (reader: ZipReader<unknown>): Promise<FileEntry[]> => {
  const { maxEntries, maxEntryBytes, maxTotalBytes } = getZipImportLimits();
  const entries = await reader.getEntries();
  if (entries.length > maxEntries) {
    throw new UnsafeZipError(`Archive contains more than ${maxEntries} entries.`);
  }

  const fileEntries = entries.filter(isFileEntry).filter((entry) => !entry.symlink);

  let declaredTotal = 0;
  for (const entry of fileEntries) {
    if (entry.uncompressedSize > maxEntryBytes) {
      throw new UnsafeZipError(`Archive entry exceeds the ${maxEntryBytes} byte limit.`);
    }
    declaredTotal += entry.uncompressedSize;
    if (declaredTotal > maxTotalBytes) {
      throw new UnsafeZipError(`Archive expands beyond the ${maxTotalBytes} byte limit.`);
    }
  }

  return fileEntries;
};

/**
 * Inflates one entry into a Blob, counting the bytes actually produced. The size in the central
 * directory is attacker-controlled and can understate the real size, so the declared-size check
 * in {@link listSafeFileEntries} is not enough on its own.
 */
export const readEntryBounded = async (entry: FileEntry, type?: string): Promise<Blob> => {
  const { maxEntryBytes } = getZipImportLimits();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let written = 0;

  const writable = new WritableStream<Uint8Array<ArrayBuffer>>({
    write(chunk) {
      written += chunk.length;
      if (written > maxEntryBytes) {
        throw new UnsafeZipError(`Archive entry exceeds the ${maxEntryBytes} byte limit.`);
      }
      chunks.push(chunk);
    },
  });

  await entry.getData({ writable });
  return new Blob(chunks, type ? { type } : undefined);
};

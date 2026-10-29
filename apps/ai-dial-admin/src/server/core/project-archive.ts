import { BlobReader, ZipReader } from '@zip.js/zip.js';

/**
 * Reads the uncompressed size of every file in a project archive from its central directory alone — nothing is
 * inflated. Core's project metadata carries no sizes, so this is the only way to learn them (the chat application
 * reads the same archive for the same reason). Keyed by the entry's path relative to the project root.
 */
export const readArchiveFileSizes = async (archive: Blob): Promise<Map<string, number>> => {
  const reader = new ZipReader(new BlobReader(archive), { filenameValidation: 'tolerant' });
  try {
    const entries = await reader.getEntries();
    return new Map(
      entries.filter((entry) => !entry.directory).map((entry) => [entry.filename, entry.uncompressedSize]),
    );
  } finally {
    await reader.close();
  }
};

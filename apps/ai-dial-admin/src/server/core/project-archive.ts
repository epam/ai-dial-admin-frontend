import { BlobReader, ZipReader } from '@zip.js/zip.js';

/**
 * Reads a response body into a `Blob`, giving up (`undefined`) once it exceeds `maxBytes`. A declared
 * `content-length` over the cap is refused without reading anything; a body with no `content-length` (a chunked
 * response) is counted as it streams and cancelled the moment it passes the cap, so an undeclared size can never
 * be buffered whole.
 */
export const readBodyWithin = async (response: Response, maxBytes: number): Promise<Blob | undefined> => {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel();
    return undefined;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return new Blob([]);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return new Blob(chunks as BlobPart[]);
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
};

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

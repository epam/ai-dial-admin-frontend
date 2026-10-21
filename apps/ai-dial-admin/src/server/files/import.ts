import { BlobReader, FileEntry, ZipReader } from '@zip.js/zip.js';

import { ServerActionResponse } from '@/src/models/server-action';
import { ConsecutiveFailureCircuitBreaker } from './circuit-breaker';
import { inferContentTypeFromFileName, isValidZipEntryPath, stripZipFilesPrefix } from './zip-import';
import { listSafeFileEntries, readEntryBounded, ZIP_READER_OPTIONS } from '@/src/server/zip/zip-safety';

export interface FileImportResult {
  targetPath: string;
  status: 'success' | 'failure' | 'skipped';
  error?: string;
}

export interface FileImportOutcome {
  importResults: FileImportResult[];
}

type UploadFn = (targetPath: string, file: File) => Promise<ServerActionResponse>;

const PRECONDITION_FAILED_STATUS = 412;

/** Uploads one file, classifying the outcome for the import-results contract the FE UI already renders. */
async function uploadAndClassify(
  targetPath: string,
  file: File,
  upload: UploadFn,
  breaker: ConsecutiveFailureCircuitBreaker,
): Promise<FileImportResult> {
  const result = await upload(targetPath, file);
  if (result.success) {
    breaker.recordSuccess();
    return { targetPath, status: 'success' };
  }
  if (result.status === PRECONDITION_FAILED_STATUS) {
    breaker.recordSuccess();
    return { targetPath, status: 'skipped' };
  }
  breaker.recordFailure();
  return { targetPath, status: 'failure', error: result.errorMessage };
}

/** Plain multi-file import: one Core PUT per file, aborting after N consecutive failures (design D3). */
export async function importPlainFiles(
  files: File[],
  destinationFolder: string,
  upload: UploadFn,
  threshold: number,
): Promise<FileImportOutcome> {
  const breaker = new ConsecutiveFailureCircuitBreaker(threshold);
  const importResults: FileImportResult[] = [];

  for (const file of files) {
    if (breaker.isOpen()) {
      break;
    }
    const targetPath = `${destinationFolder}${file.name}`;
    importResults.push(await uploadAndClassify(targetPath, file, upload, breaker));
  }

  return { importResults };
}

/** Thrown when a zip archive has no entries that survive `isValidZipEntryPath` validation. */
export class InvalidImportZipError extends Error {
  constructor() {
    super('Zip archive contains no valid file entries under the files/ prefix.');
    this.name = 'InvalidImportZipError';
  }
}

/**
 * Inflates one entry into a `File`. Kept in its own scope so the inflated data becomes
 * collectable as soon as the `File` owns it, instead of staying alive for the whole upload —
 * that overlap is what pushes a ~100 MB entry towards the pod's memory limit.
 */
async function extractEntryAsFile(entry: FileEntry, fileName: string): Promise<File> {
  const type = inferContentTypeFromFileName(fileName);
  const blob = await readEntryBounded(entry, type);
  return new File([blob], fileName, { type });
}

/**
 * Zip-archive import: validates every entry's path (design D4, security-relevant — see
 * `zip-import.ts`), bounds entry count and inflated size (`zip-safety.ts`), infers a content type
 * per entry (design D5), and uploads each valid entry through the same circuit breaker as plain import.
 */
export async function importZipFile(
  zipFile: File,
  destinationFolder: string,
  upload: UploadFn,
  threshold: number,
  flatImport?: boolean,
): Promise<FileImportOutcome> {
  const reader = new ZipReader(new BlobReader(zipFile), ZIP_READER_OPTIONS);

  try {
    const entries = await listSafeFileEntries(reader);
    const validEntries = entries.filter((entry) => isValidZipEntryPath(entry.filename));

    if (validEntries.length === 0) {
      throw new InvalidImportZipError();
    }

    const breaker = new ConsecutiveFailureCircuitBreaker(threshold);
    const importResults: FileImportResult[] = [];
    const seenTargetPaths = new Set<string>();

    for (const entry of validEntries) {
      if (breaker.isOpen()) {
        break;
      }
      const relativePath = stripZipFilesPrefix(entry.filename);
      const fileName = relativePath.split('/').pop() || relativePath;
      const targetPath = `${destinationFolder}${flatImport ? fileName : relativePath}`;

      if (seenTargetPaths.has(targetPath)) {
        importResults.push({ targetPath, status: 'failure', error: 'Duplicate entry in archive' });
        continue;
      }
      seenTargetPaths.add(targetPath);

      const file = await extractEntryAsFile(entry, fileName);
      importResults.push(await uploadAndClassify(targetPath, file, upload, breaker));
    }

    return { importResults };
  } finally {
    await reader.close();
  }
}

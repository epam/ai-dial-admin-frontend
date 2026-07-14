import JSZip from 'jszip';

import { ServerActionResponse } from '@/src/models/server-action';
import { ConsecutiveFailureCircuitBreaker } from './circuit-breaker';
import { inferContentTypeFromFileName, isValidZipEntryPath, stripZipFilesPrefix } from './zip-import';

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
 * Zip-archive import: validates every entry's path (design D4, security-relevant — see
 * `zip-import.ts`), infers a content type per entry (design D5), and uploads each valid
 * entry through the same circuit breaker as plain import.
 */
export async function importZipFile(
  zipFile: File,
  destinationFolder: string,
  upload: UploadFn,
  threshold: number,
): Promise<FileImportOutcome> {
  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const validEntries = entries.filter((entry) => isValidZipEntryPath(entry.name));

  if (validEntries.length === 0) {
    throw new InvalidImportZipError();
  }

  const breaker = new ConsecutiveFailureCircuitBreaker(threshold);
  const importResults: FileImportResult[] = [];

  for (const entry of validEntries) {
    if (breaker.isOpen()) {
      break;
    }
    const relativePath = stripZipFilesPrefix(entry.name);
    const fileName = relativePath.split('/').pop() || relativePath;
    const targetPath = `${destinationFolder}${relativePath}`;
    const content = await entry.async('arraybuffer');
    const file = new File([content], fileName, { type: inferContentTypeFromFileName(fileName) });

    importResults.push(await uploadAndClassify(targetPath, file, upload, breaker));
  }

  return { importResults };
}

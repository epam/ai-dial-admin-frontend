import {
  BYTES_PER_MB,
  ZIP_IMPORT_DEFAULT_MAX_ENTRIES,
  ZIP_IMPORT_DEFAULT_MAX_ENTRY_SIZE_MB,
  ZIP_IMPORT_DEFAULT_MAX_TOTAL_SIZE_MB,
} from './constants';

export interface ZipImportLimits {
  maxEntries: number;
  maxEntryBytes: number;
  maxTotalBytes: number;
}

const readPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Limits for untrusted zip imports, overridable per deployment. Read on every call so a value is
 * picked up from the running process's environment rather than frozen at import time.
 */
export const getZipImportLimits = (): ZipImportLimits => ({
  maxEntries: readPositiveInt(process.env.ZIP_IMPORT_MAX_ENTRIES, ZIP_IMPORT_DEFAULT_MAX_ENTRIES),
  maxEntryBytes:
    readPositiveInt(process.env.ZIP_IMPORT_MAX_ENTRY_SIZE_MB, ZIP_IMPORT_DEFAULT_MAX_ENTRY_SIZE_MB) * BYTES_PER_MB,
  maxTotalBytes:
    readPositiveInt(process.env.ZIP_IMPORT_MAX_TOTAL_SIZE_MB, ZIP_IMPORT_DEFAULT_MAX_TOTAL_SIZE_MB) * BYTES_PER_MB,
});

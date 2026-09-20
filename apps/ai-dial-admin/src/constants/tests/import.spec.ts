import { MAX_FILE_SIZE_MB, MAX_MULTI_FILES_SIZE_MB } from '@/src/constants/file';
import { ImportI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { ConflictResolutionPolicy, ImportFileType, ImportSteps } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  ARCHIVE_IMPORT_TYPE,
  DIAL_JSON_IMPORT_TYPE,
  IMPORT_CONFIG_STEPS,
  IMPORT_FILE_TYPES,
  IMPORT_RESOLUTIONS,
  IMPORT_STEPS,
  SEPARATE_FILES_IMPORT_TYPE,
} from '../import';

const t = (s: string) => s;

describe('IMPORT_RESOLUTIONS', () => {
  test('returns OVERRIDE and SKIP by default', () => {
    const result = IMPORT_RESOLUTIONS(t);
    expect(result).toEqual([
      { id: ConflictResolutionPolicy.OVERRIDE, name: ImportI18nKey.Override },
      { id: ConflictResolutionPolicy.SKIP, name: ImportI18nKey.Skip },
    ]);
  });
});

describe('IMPORT_STEPS', () => {
  test('returns steps for files and properties', () => {
    const steps = IMPORT_STEPS(t);
    expect(steps).toEqual([
      { id: ImportSteps.FILES, name: ImportI18nKey.Files },
      { id: ImportSteps.PROPERTIES, name: TabsI18nKey.Properties },
    ]);
  });
});

describe('IMPORT_CONFIG_STEPS', () => {
  test('returns steps for files and configuration', () => {
    const steps = IMPORT_CONFIG_STEPS(t);
    expect(steps).toEqual([
      { id: ImportSteps.FILES, name: ImportI18nKey.Files },
      { id: ImportSteps.CONFIGURATION, name: ImportI18nKey.Configuration },
    ]);
  });
});

describe('IMPORT_FILE_TYPES', () => {
  test('returns only ARCHIVE by default', () => {
    const result = IMPORT_FILE_TYPES(t);
    expect(result).toEqual([ARCHIVE_IMPORT_TYPE(t)]);
  });

  test('returns ARCHIVE and JSON for Prompts route', () => {
    const result = IMPORT_FILE_TYPES(t, ApplicationRoute.Prompts);
    expect(result.some((r) => r.id === ImportFileType.ARCHIVE)).toBe(true);
    expect(result.some((r) => r.id === ImportFileType.JSON)).toBe(true);
  });

  test('returns ARCHIVE and FILES for Files route', () => {
    const result = IMPORT_FILE_TYPES(t, ApplicationRoute.Files);
    expect(result.some((r) => r.id === ImportFileType.ARCHIVE)).toBe(true);
    expect(result.some((r) => r.id === ImportFileType.FILES)).toBe(true);
  });
});

describe('import file type helper text size limits', () => {
  test('ARCHIVE_IMPORT_TYPE passes the per-file size limit to the description key', () => {
    const spyT = vi.fn(t);
    ARCHIVE_IMPORT_TYPE(spyT);
    expect(spyT).toHaveBeenCalledWith(ImportI18nKey.DialArchiveDescription, { size: MAX_FILE_SIZE_MB });
  });

  test('SEPARATE_FILES_IMPORT_TYPE passes the per-file and total size limits to the description key', () => {
    const spyT = vi.fn(t);
    SEPARATE_FILES_IMPORT_TYPE(spyT);
    expect(spyT).toHaveBeenCalledWith(ImportI18nKey.SeparateFilesDescription, {
      size: MAX_FILE_SIZE_MB,
      totalSize: MAX_MULTI_FILES_SIZE_MB,
    });
  });

  test('DIAL_JSON_IMPORT_TYPE passes the per-file and total size limits to the description key', () => {
    const spyT = vi.fn(t);
    DIAL_JSON_IMPORT_TYPE(spyT);
    expect(spyT).toHaveBeenCalledWith(ImportI18nKey.SeparateFilesDescription, {
      size: MAX_FILE_SIZE_MB,
      totalSize: MAX_MULTI_FILES_SIZE_MB,
    });
  });
});

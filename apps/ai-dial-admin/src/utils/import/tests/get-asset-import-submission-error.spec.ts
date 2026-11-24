import { describe, expect, test, vi } from 'vitest';

import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { ImportI18nKey } from '@/src/constants/i18n';
import { ImportData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getAssetImportSubmissionError } from '@/src/utils/import/get-asset-import-submission-error';

const MIB = 1024 * 1024;

const createBody = (fileSize: number, configSize = 0) => {
  const file = new File(['{}'], 'data.json');
  const config = new File(['{}'], 'config.json');
  Object.defineProperty(file, 'size', { value: fileSize });
  Object.defineProperty(config, 'size', { value: configSize });
  const body = new FormData();
  vi.spyOn(body, 'get').mockImplementation((name) => (name === 'file' ? file : config));
  return body;
};

describe('getAssetImportSubmissionError', () => {
  test('accepts prepared JSON and config exactly at their limits', () => {
    expect(getAssetImportSubmissionError(createBody(64 * MIB, MIB), ImportFileType.JSON)).toBeUndefined();
  });

  test('rejects prepared JSON one byte above the limit', () => {
    expect(getAssetImportSubmissionError(createBody(64 * MIB + 1), ImportFileType.JSON)).toBe(
      ImportI18nKey.PreparedJsonSizeError,
    );
  });

  test('rejects config one byte above its limit', () => {
    expect(getAssetImportSubmissionError(createBody(1, MIB + 1), ImportFileType.ARCHIVE)).toBe(
      ImportI18nKey.ImportConfigSizeError,
    );
  });

  test('does not apply the prepared JSON check to an archive', () => {
    expect(getAssetImportSubmissionError(createBody(64 * MIB + 1), ImportFileType.ARCHIVE)).toBeUndefined();
  });

  test('rejects source JSON that grows past the limit when the application id is rewritten', () => {
    const name = '€'.repeat(5_600_000);
    const data = { applications: [{ id: 'applications/public/original__v1', name }] } as ImportData;
    const source = new Blob([JSON.stringify(data)]);
    expect(source.size).toBeLessThan(64 * MIB);

    const { body } = getFormDataForImport(
      'public/',
      data,
      ImportFileType.JSON,
      ConflictResolutionPolicy.SKIP,
      undefined,
      undefined,
      ApplicationRoute.AssetsApplications,
    );

    expect(getAssetImportSubmissionError(body, ImportFileType.JSON)).toBe(ImportI18nKey.PreparedJsonSizeError);
  });
});

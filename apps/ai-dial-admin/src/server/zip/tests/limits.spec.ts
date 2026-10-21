import { afterEach, describe, expect, test } from 'vitest';

import { getZipImportLimits } from '../limits';

const ENV_NAMES = ['ZIP_IMPORT_MAX_ENTRIES', 'ZIP_IMPORT_MAX_ENTRY_SIZE_MB', 'ZIP_IMPORT_MAX_TOTAL_SIZE_MB'];

describe('Server :: Zip :: limits :: getZipImportLimits', () => {
  afterEach(() => ENV_NAMES.forEach((name) => delete process.env[name]));

  test('uses defaults when nothing is set', () => {
    expect(getZipImportLimits()).toEqual({
      maxEntries: 500,
      maxEntryBytes: 100 * 1024 * 1024,
      maxTotalBytes: 1024 * 1024 * 1024,
    });
  });

  test('applies overrides read at call time, converting MB to bytes', () => {
    process.env.ZIP_IMPORT_MAX_ENTRIES = '50';
    process.env.ZIP_IMPORT_MAX_ENTRY_SIZE_MB = '8';
    process.env.ZIP_IMPORT_MAX_TOTAL_SIZE_MB = '16';

    expect(getZipImportLimits()).toEqual({
      maxEntries: 50,
      maxEntryBytes: 8 * 1024 * 1024,
      maxTotalBytes: 16 * 1024 * 1024,
    });
  });

  test.each(['', 'abc', '0', '-5', '1.5'])('falls back to the default for invalid value %j', (value) => {
    process.env.ZIP_IMPORT_MAX_ENTRIES = value;

    expect(getZipImportLimits().maxEntries).toBe(500);
  });
});

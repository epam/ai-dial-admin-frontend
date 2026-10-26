import { describe, expect, test } from 'vitest';

import { FileUploadError } from '@/src/components/Common/FileUploadField/models';
import { getAccept, isTotalSizeExceeded, validateFiles } from '@/src/components/Common/FileUploadField/utils';

const BYTES_IN_MB = 1024 * 1024;

const makeFile = (name: string, type: string, sizeMb = 0): File => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeMb * BYTES_IN_MB });
  return file;
};

describe('getAccept', () => {
  test('maps the any-file token to no restriction', () => {
    expect(getAccept('/')).toBeUndefined();
  });

  test('passes other accept strings through', () => {
    expect(getAccept('application/json')).toBe('application/json');
  });
});

describe('validateFiles', () => {
  const json = makeFile('a.json', 'application/json');

  test('accepts a matching selection', () => {
    expect(validateFiles({ incoming: [json], existingCount: 0, acceptTypes: 'application/json' })).toBeUndefined();
  });

  test.each([
    ['application/JSON', 'a.json', 'application/json'],
    ['.json, application/json', 'a.json', 'application/json'],
    ['.zip, application/x-zip-compressed, application/zip', 'a.zip', ''],
  ])('matches %s case-insensitively and by extension', (acceptTypes, name, type) => {
    expect(validateFiles({ incoming: [makeFile(name, type)], existingCount: 0, acceptTypes })).toBeUndefined();
  });

  test('accepts any file for the any-file token', () => {
    expect(
      validateFiles({ incoming: [makeFile('a.bin', 'application/octet-stream')], existingCount: 0, acceptTypes: '/' }),
    ).toBeUndefined();
  });

  test('reports a wrong format', () => {
    expect(
      validateFiles({ incoming: [makeFile('a.txt', 'text/plain')], existingCount: 0, acceptTypes: 'application/json' }),
    ).toBe(FileUploadError.Format);
  });

  test('reports a file over the single-file size limit', () => {
    expect(
      validateFiles({
        incoming: [makeFile('a.json', 'application/json', 3)],
        existingCount: 0,
        acceptTypes: '/',
        maxFileSize: 2,
      }),
    ).toBe(FileUploadError.Size);
  });

  test('reports too many files counting the existing ones', () => {
    expect(validateFiles({ incoming: [json, json], existingCount: 0, acceptTypes: '/', maxFilesCount: 1 })).toBe(
      FileUploadError.Count,
    );
    expect(validateFiles({ incoming: [json], existingCount: 1, acceptTypes: '/', maxFilesCount: 1 })).toBe(
      FileUploadError.Count,
    );
  });

  test('checks format before size before count', () => {
    const bigText = makeFile('a.txt', 'text/plain', 3);
    expect(
      validateFiles({
        incoming: [bigText, bigText],
        existingCount: 0,
        acceptTypes: 'application/json',
        maxFileSize: 2,
        maxFilesCount: 1,
      }),
    ).toBe(FileUploadError.Format);
    const bigJson = makeFile('a.json', 'application/json', 3);
    expect(
      validateFiles({
        incoming: [bigJson, bigJson],
        existingCount: 0,
        acceptTypes: '/',
        maxFileSize: 2,
        maxFilesCount: 1,
      }),
    ).toBe(FileUploadError.Size);
  });

  test('skips limits that are not set', () => {
    expect(
      validateFiles({
        incoming: [makeFile('a.json', 'application/json', 500), json],
        existingCount: 10,
        acceptTypes: '/',
      }),
    ).toBeUndefined();
  });
});

describe('isTotalSizeExceeded', () => {
  const files = [makeFile('a', '', 2), makeFile('b', '', 2)];

  test('is true above the limit', () => {
    expect(isTotalSizeExceeded(files, 3)).toBe(true);
  });

  test('is false at or below the limit', () => {
    expect(isTotalSizeExceeded(files, 4)).toBe(false);
  });

  test('is false without a limit', () => {
    expect(isTotalSizeExceeded(files)).toBe(false);
  });
});

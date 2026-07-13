import { describe, expect, test } from 'vitest';

import {
  DEFAULT_CONTENT_TYPE,
  inferContentTypeFromFileName,
  isValidZipEntryPath,
  stripZipFilesPrefix,
} from '../zip-import';

describe('Server :: Files :: zip-import :: isValidZipEntryPath', () => {
  test('accepts a well-formed entry under the files/ prefix', () => {
    expect(isValidZipEntryPath('files/folder/doc.txt')).toBe(true);
  });

  test('rejects a parent-directory traversal entry', () => {
    expect(isValidZipEntryPath('files/../../etc/passwd')).toBe(false);
    expect(isValidZipEntryPath('files/folder/../../secret.txt')).toBe(false);
  });

  test('rejects an absolute POSIX path', () => {
    expect(isValidZipEntryPath('/etc/passwd')).toBe(false);
  });

  test('rejects an absolute Windows path', () => {
    expect(isValidZipEntryPath('C:\\Windows\\System32\\config')).toBe(false);
  });

  test('rejects a null byte in the entry path', () => {
    expect(isValidZipEntryPath('files/doc.txt\0.exe')).toBe(false);
  });

  test('rejects a backslash-normalized escape outside the files/ prefix', () => {
    expect(isValidZipEntryPath('files\\..\\..\\outside.txt')).toBe(false);
  });

  test('rejects an entry outside the files/ prefix entirely', () => {
    expect(isValidZipEntryPath('conversations/public/x')).toBe(false);
    expect(isValidZipEntryPath('doc.txt')).toBe(false);
  });

  test('rejects an empty path', () => {
    expect(isValidZipEntryPath('')).toBe(false);
  });
});

describe('Server :: Files :: zip-import :: stripZipFilesPrefix', () => {
  test('strips the files/ prefix, leaving the relative path', () => {
    expect(stripZipFilesPrefix('files/folder/doc.txt')).toBe('folder/doc.txt');
  });

  test('normalizes backslashes before stripping', () => {
    expect(stripZipFilesPrefix('files\\folder\\doc.txt')).toBe('folder/doc.txt');
  });
});

describe('Server :: Files :: zip-import :: inferContentTypeFromFileName', () => {
  test('infers a specific content type for a known extension', () => {
    expect(inferContentTypeFromFileName('report.pdf')).toBe('application/pdf');
    expect(inferContentTypeFromFileName('image.PNG')).toBe('image/png');
  });

  test('falls back to a generic binary type for an unknown or missing extension', () => {
    expect(inferContentTypeFromFileName('archive.xyz')).toBe(DEFAULT_CONTENT_TYPE);
    expect(inferContentTypeFromFileName('no-extension')).toBe(DEFAULT_CONTENT_TYPE);
    expect(inferContentTypeFromFileName('trailing-dot.')).toBe(DEFAULT_CONTENT_TYPE);
  });
});

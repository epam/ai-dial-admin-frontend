import { CONTENT_DISPOSITION_HEADER, getFileName, getFileNameFromContentDisposition } from '../get-file-name';
import { expect, test, describe, vi, beforeEach } from 'vitest';

describe('Utils :: getFileName', () => {
  test('Should return undefined', () => {
    const result = getFileName(new Response(null, { headers: { [CONTENT_DISPOSITION_HEADER]: 'test' } }));
    expect(result).toBeUndefined();
  });

  test('Should return Undefined', () => {
    const result = getFileName(
      new Response(null, { headers: { [CONTENT_DISPOSITION_HEADER]: 'test filename="file.json"' } }),
    );
    expect(result).toBe('file.json');
  });
});

describe('Utils :: getFileNameFromContentDisposition', () => {
  test('returns null when the header is missing', () => {
    expect(getFileNameFromContentDisposition(null)).toBe(null);
    expect(getFileNameFromContentDisposition(undefined)).toBe(null);
  });

  test('extracts a quoted filename', () => {
    expect(getFileNameFromContentDisposition('attachment; filename="export.zip"')).toBe('export.zip');
  });

  test('extracts an unquoted filename', () => {
    expect(getFileNameFromContentDisposition('attachment; filename=export.zip')).toBe('export.zip');
  });

  test('returns null when no filename is present', () => {
    expect(getFileNameFromContentDisposition('inline')).toBe(null);
  });
});

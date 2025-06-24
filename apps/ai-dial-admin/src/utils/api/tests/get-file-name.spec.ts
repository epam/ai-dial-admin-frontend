import { CONTENT_DISPOSITION_HEADER, getFileName } from '../get-file-name';
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

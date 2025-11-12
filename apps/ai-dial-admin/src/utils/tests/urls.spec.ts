import { addTrailingSlash } from '../url';
import { describe, expect, test } from 'vitest';

describe('Utils :: addTrailingSlash', () => {
  test('Should add slash', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });

  test('Should not add slash if exists', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder/');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });
});

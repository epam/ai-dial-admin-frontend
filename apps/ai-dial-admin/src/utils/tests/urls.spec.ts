import { addTrailingSlash, removeSlash } from '../url';
import { describe, expect, test } from 'vitest';

describe('Utils :: addTrailingSlash', () => {
  test('Should add slash', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });

  test('Should return empty string', () => {
    expect(addTrailingSlash()).toEqual('');
    expect(addTrailingSlash('')).toEqual('');
  });

  test('Should not add slash if exists', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder/');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });
});

describe('Utils :: removeSlash', () => {
  test('Should remove slash', () => {
    const res = removeSlash('/folder1/folder2/all/folder');
    expect(res).toEqual('folder1/folder2/all/folder');
  });

  test('Should remove slash', () => {
    const res = removeSlash('folder1/folder2/all/folder');
    expect(res).toEqual('folder1/folder2/all/folder');
  });
});

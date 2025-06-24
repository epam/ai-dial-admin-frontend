import { DialFileNodeType } from '@/src/models/dial/file';
import {
  addTrailingSlash,
  changePath,
  checkPaths,
  getFolderNameAndPath,
  getListOfPathsToMove,
  getPathSegments,
  isFolder,
  removeTrailingSlash,
} from '@/src/utils/files/path';
import { describe, expect, test } from 'vitest';

describe('Utils :: files :: changePath', () => {
  test('Should change folder path', () => {
    const res = changePath('folder1/folder2/all/folder', 'newPath');
    expect(res).toEqual('newPath/folder');
  });
});

describe('Utils :: files :: checkPaths', () => {
  test('Should return true when filepath not provided', () => {
    const res = checkPaths('folder1/folder2/all/folder');
    expect(res).toBeTruthy();
  });

  test('Should return true when filepath same', () => {
    const res = checkPaths('folder1/folder2/all/folder', 'folder1/folder2/all/folder/');
    expect(res).toBeTruthy();
  });

  test('Should return false when filepath not same', () => {
    const res = checkPaths('folder1/folder2/all/folder', 'folder1/folder2/all/folder1/');
    expect(res).toBeFalsy();
  });

  test('Should return false when filepath provided', () => {
    const res = checkPaths('folder1/folder2/all/folder', 'filepath');
    expect(res).toBeFalsy();
  });
});

describe('Utils :: files :: getFolderNameAndPath', () => {
  test('Should return folder name', () => {
    const res = getFolderNameAndPath('folder1/folder2/all/folder');
    expect(res).toEqual({
      name: 'folder',
      path: 'folder1/folder2/all',
    });
  });

  test('Should return empty string folder name', () => {
    const res = getFolderNameAndPath('');
    expect(res).toEqual({ name: '', path: '' });
  });
});

describe('Utils :: files :: getListOfPathsToMove', () => {
  test('Should return correct list of paths from prompts', () => {
    const res = getListOfPathsToMove({ name: 'name' }, null, [
      { name: 'name', path: 'path' },
      { name: 'name', path: 'path2' },
      { name: 'name', path: 'path3' },
      { name: 'name2', path: 'path4' },
    ]);
    expect(res).toEqual(['path', 'path2', 'path3']);
  });

  test('Should return correct list of paths from map', () => {
    const res = getListOfPathsToMove(
      { name: 'name', folderId: 'folder' },
      {
        'folder/': [
          { name: 'name', path: 'path' },
          { name: 'name', path: 'path2' },
          { name: 'name', path: 'path3' },
          { name: 'name2', path: 'path4' },
        ],
      },
      null,
    );
    expect(res).toEqual(['path', 'path2', 'path3']);
  });
  test('Should return correct list of paths from map with extension', () => {
    const res = getListOfPathsToMove(
      { name: 'name.txt', folderId: 'folder' },
      {
        'folder/': [
          { name: 'name.txt', path: 'path' },
          { name: 'name.txt', path: 'path2' },
          { name: 'name.txt', path: 'path3' },
          { name: 'name2.txt', path: 'path4' },
        ],
      },
      null,
      true,
    );
    expect(res).toEqual([]);
  });

  test('Should return  empty array', () => {
    const res = getListOfPathsToMove({ name: 'name.txt', folderId: 'folder' }, null, null, true);
    expect(res).toEqual([]);
  });
});

describe('Utils :: file :: removeTrailingSlash', () => {
  test('Should correctly remove trailing slash', () => {
    expect(removeTrailingSlash('public/')).toBe('public');
    expect(removeTrailingSlash('public//')).toBe('public');
    expect(removeTrailingSlash('public/folder/subfolder/')).toBe('public/folder/subfolder');
  });

  test('Should return empty string if path not provided', () => {
    expect(removeTrailingSlash(undefined)).toBe('');
  });
});

describe('Utils :: file :: addTrailingSlash', () => {
  test('Should add slash', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });

  test('Should not add slash if exists', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder/');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });
});

describe('Utils :: file :: isFolder', () => {
  test('Should return false', () => {
    const res1 = isFolder();
    const res2 = isFolder(DialFileNodeType.ITEM);
    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
  });

  test('Should return true', () => {
    const res = isFolder(DialFileNodeType.FOLDER);
    expect(res).toBeTruthy();
  });
});

describe('Utils :: file :: getPathSegments', () => {
  test('should return segments for a simple path', () => {
    const input = 'a/b/c';
    const expected = ['a/', 'a/b/', 'a/b/c/'];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should handle leading slash', () => {
    const input = '/a/b/c';
    const expected = ['a/', 'a/b/', 'a/b/c/'];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should handle trailing slash', () => {
    const input = 'a/b/c/';
    const expected = ['a/', 'a/b/', 'a/b/c/'];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should handle both leading and trailing slashes', () => {
    const input = '/a/b/c/';
    const expected = ['a/', 'a/b/', 'a/b/c/'];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should return empty array for empty string', () => {
    const input = '';
    const expected: string[] = [];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should return empty array for root slash', () => {
    const input = '/';
    const expected: string[] = [];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should ignore multiple slashes between segments', () => {
    const input = 'a//b///c';
    const expected = ['a/', 'a/b/', 'a/b/c/'];
    expect(getPathSegments(input)).toEqual(expected);
  });

  test('should handle single segment', () => {
    const input = 'a';
    const expected = ['a/'];
    expect(getPathSegments(input)).toEqual(expected);
  });
});

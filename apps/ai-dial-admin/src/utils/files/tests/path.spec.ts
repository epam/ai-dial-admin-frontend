import { DialFileNodeType } from '@/src/models/dial/file';
import {
  addTrailingSlash,
  changePath,
  checkPaths,
  getFolderNameAndPath,
  getListOfPathsToMove,
  isFolder,
  removeTrailingSlash,
} from '@/src/utils/files/path';

describe('Utils :: files :: changePath', () => {
  it('Should change folder path', () => {
    const res = changePath('folder1/folder2/all/folder', 'newPath');
    expect(res).toEqual('newPath/folder');
  });
});

describe('Utils :: files :: checkPaths', () => {
  it('Should return true when filepath not provided', () => {
    const res = checkPaths('folder1/folder2/all/folder');
    expect(res).toBeTruthy();
  });

  it('Should return true when filepath same', () => {
    const res = checkPaths('folder1/folder2/all/folder', 'folder1/folder2/all/folder/');
    expect(res).toBeTruthy();
  });

  it('Should return false when filepath not same', () => {
    const res = checkPaths('folder1/folder2/all/folder', 'folder1/folder2/all/folder1/');
    expect(res).toBeFalsy();
  });

  it('Should return false when filepath provided', () => {
    const res = checkPaths('folder1/folder2/all/folder', 'filepath');
    expect(res).toBeFalsy();
  });
});

describe('Utils :: files :: getFolderNameAndPath', () => {
  it('Should return folder name', () => {
    const res = getFolderNameAndPath('folder1/folder2/all/folder');
    expect(res).toEqual({
      name: 'folder',
      path: 'folder1/folder2/all',
    });
  });

  it('Should return empty string folder name', () => {
    const res = getFolderNameAndPath('');
    expect(res).toEqual({ name: '', path: '' });
  });
});

describe('Utils :: files :: getListOfPathsToMove', () => {
  it('Should return correct list of paths from prompts', () => {
    const res = getListOfPathsToMove({ name: 'name' }, null, [
      { name: 'name', path: 'path' },
      { name: 'name', path: 'path2' },
      { name: 'name', path: 'path3' },
      { name: 'name2', path: 'path4' },
    ]);
    expect(res).toEqual(['path', 'path2', 'path3']);
  });

  it('Should return correct list of paths from map', () => {
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
  it('Should return correct list of paths from map with extension', () => {
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

  it('Should return  empty array', () => {
    const res = getListOfPathsToMove({ name: 'name.txt', folderId: 'folder' }, null, null, true);
    expect(res).toEqual([]);
  });
});

describe('Utils :: file :: removeTrailingSlash', () => {
  it('Should correctly remove trailing slash', () => {
    expect(removeTrailingSlash('public/')).toBe('public');
    expect(removeTrailingSlash('public//')).toBe('public');
    expect(removeTrailingSlash('public/folder/subfolder/')).toBe('public/folder/subfolder');
  });

  it('Should return empty string if path not provided', () => {
    expect(removeTrailingSlash(undefined)).toBe('');
  });
});

describe('Utils :: file :: addTrailingSlash', () => {
  it('Should add slash', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });

  it('Should not add slash if exists', () => {
    const res = addTrailingSlash('folder1/folder2/all/folder/');
    expect(res).toEqual('folder1/folder2/all/folder/');
  });
});

describe('Utils :: file :: isFolder', () => {
  it('Should return false', () => {
    const res1 = isFolder();
    const res2 = isFolder(DialFileNodeType.ITEM);
    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
  });

  it('Should return true', () => {
    const res = isFolder(DialFileNodeType.FOLDER);
    expect(res).toBeTruthy();
  });
});

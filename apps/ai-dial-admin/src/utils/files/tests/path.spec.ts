import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import {
  changeFolderName,
  changePath,
  checkPaths,
  checkSelectedPath,
  getFolderNameAndPath,
  getListOfPathsToBulkDelete,
  getListOfPathsToMove,
  getPathSegments,
  isFolder,
  removeTrailingSlash,
  updatePathWithNameAndVersion,
} from '@/src/utils/files/path';
import { describe, expect, test, vi } from 'vitest';
import * as findFolderChildrenModule from '../folder';

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

describe('Utils :: files :: getListOfPathsToBulkDelete', () => {
  test('Should return all paths from a record of DialFiles', () => {
    const record = {
      'folder1/': [
        { path: 'folder1/file1', name: 'file1', nodeType: 'item' },
        { path: 'folder1/file2', name: 'file2', nodeType: 'item' },
      ],
      'folder2/': [{ path: 'folder2/file3', name: 'file3', nodeType: 'item' }],
    };

    const res = getListOfPathsToBulkDelete(record);
    expect(res).toEqual([{ path: 'folder1/file1' }, { path: 'folder1/file2' }, { path: 'folder2/file3' }]);
  });

  test('Should return all paths from a record of DialPrompts', () => {
    const record = {
      'folder1/': [
        { path: 'folder1/prompt1', name: 'prompt1', prompt: 'Write a poem' },
        { path: 'folder1/prompt2', name: 'prompt2', prompt: 'Write code' },
      ],
    };

    const res = getListOfPathsToBulkDelete(record);
    expect(res).toEqual([{ path: 'folder1/prompt1' }, { path: 'folder1/prompt2' }]);
  });

  test('Should return empty array for empty record', () => {
    const res = getListOfPathsToBulkDelete({});
    expect(res).toEqual([]);
  });

  test('Should return empty array for undefined record', () => {
    const res = getListOfPathsToBulkDelete();
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

describe('Utils :: files :: checkSelectedPath', () => {
  test('returns true when initialPath is a direct folder child of filePath', () => {
    const files: DialFolder[] = [
      {
        path: '/root',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ];

    vi.spyOn(findFolderChildrenModule, 'findFolderChildren').mockReturnValue(['/root/folder1', '/root/folder2']);

    const result = checkSelectedPath('/root/folder1', '/root', files);
    expect(result).toBe(true);
  });

  test('returns false when initialPath is not a direct folder child of filePath', () => {
    const files: DialFolder[] = [
      {
        path: '/root',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ];

    vi.spyOn(findFolderChildrenModule, 'findFolderChildren').mockReturnValue(['/root/folder1']);

    const result = checkSelectedPath('/root/folder2', '/root', files);
    expect(result).toBe(false);
  });

  test('returns false when findFolderChildren returns empty array', () => {
    const files: DialFolder[] = [
      {
        path: '/root',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ];

    vi.spyOn(findFolderChildrenModule, 'findFolderChildren').mockReturnValue([]);

    const result = checkSelectedPath('/root/folder1', '/root', files);
    expect(result).toBe(false);
  });

  test('compares folder names correctly even with full paths', () => {
    const files: DialFolder[] = [
      {
        path: '/project',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ];

    vi.spyOn(findFolderChildrenModule, 'findFolderChildren').mockReturnValue(['/project/src', '/project/tests']);

    const result = checkSelectedPath('/project/tests', '/project', files);
    expect(result).toBe(true);
  });
});

describe('Utils :: files :: changeFolderName', () => {
  test('Should rename last folder in a multi-level path', () => {
    const result = changeFolderName('folder1/folder2/final/', 'renamed');
    expect(result).toBe('folder1/folder2/renamed/');
  });

  test('Should rename root-level folder', () => {
    const result = changeFolderName('root/', 'newRoot');
    expect(result).toBe('newRoot/');
  });

  test('Should handle paths without trailing slash', () => {
    const result = changeFolderName('folder1/folder2/final', 'renamed');
    expect(result).toBe('folder1/folder2/renamed/');
  });

  test('Should handle single folder with no slashes', () => {
    const result = changeFolderName('folder', 'renamed');
    expect(result).toBe('renamed/');
  });

  test('Should handle empty path by returning it unchanged', () => {
    const result = changeFolderName('', 'renamed');
    expect(result).toBe('');
  });

  test('Should handle path with multiple slashes', () => {
    const result = changeFolderName('///folder1///folder2///final///', 'newFolder');
    expect(result).toBe('folder1/folder2/newFolder/');
  });

  test('Should handle path with only slashes', () => {
    const result = changeFolderName('////', 'newName');
    expect(result).toBe('////');
  });
});

describe('Utils :: files :: updatePathWithNameAndVersion', () => {
  test('Should update path with new name and version', () => {
    const oldPath =
      'PqCTwx9SUyFjJexgKjtXf2bvRz41RPtJ1WCJ52fvpQ1sJEhHedpvV7SPqqt7whAdJ3hWqev6mu982RJShLJt3RbxJqWVUdDdrJLymiy89nx9gcoM9c3BxQWyfc5yuugjrmnA3FjHVzF2rY6CyphY6Bwr8/test-pub-prompt__0.0.1';
    const result = updatePathWithNameAndVersion(oldPath, 'test-pub-prompt_new', '0.0.2');
    expect(result).toBe(
      'PqCTwx9SUyFjJexgKjtXf2bvRz41RPtJ1WCJ52fvpQ1sJEhHedpvV7SPqqt7whAdJ3hWqev6mu982RJShLJt3RbxJqWVUdDdrJLymiy89nx9gcoM9c3BxQWyfc5yuugjrmnA3FjHVzF2rY6CyphY6Bwr8/test-pub-prompt_new__0.0.2',
    );
  });

  test('Should handle simple path with name and version', () => {
    const oldPath = 'folder/my-app__1.0.0';
    const result = updatePathWithNameAndVersion(oldPath, 'my-app-updated', '2.0.0');
    expect(result).toBe('folder/my-app-updated__2.0.0');
  });

  test('Should handle nested folder structure', () => {
    const oldPath = 'root/subfolder/nested/app-name__1.2.3';
    const result = updatePathWithNameAndVersion(oldPath, 'new-app-name', '2.0.0');
    expect(result).toBe('root/subfolder/nested/new-app-name__2.0.0');
  });

  test('Should handle single folder level', () => {
    const oldPath = 'root/prompt__0.1.0';
    const result = updatePathWithNameAndVersion(oldPath, 'updated-prompt', '0.2.0');
    expect(result).toBe('root/updated-prompt__0.2.0');
  });

  test('Should handle name with underscores', () => {
    const oldPath = 'folder/my_test_app__1.0.0';
    const result = updatePathWithNameAndVersion(oldPath, 'my_new_test_app', '1.1.0');
    expect(result).toBe('folder/my_new_test_app__1.1.0');
  });

  test('Should handle name with dashes and underscores', () => {
    const oldPath = 'folder/test-pub-prompt__0.0.1';
    const result = updatePathWithNameAndVersion(oldPath, 'test-pub-prompt_new', '0.0.2');
    expect(result).toBe('folder/test-pub-prompt_new__0.0.2');
  });

  test('Should handle version with multiple digits', () => {
    const oldPath = 'folder/app__10.20.30';
    const result = updatePathWithNameAndVersion(oldPath, 'app-v2', '11.21.31');
    expect(result).toBe('folder/app-v2__11.21.31');
  });

  test('Should handle version with prerelease info', () => {
    const oldPath = 'folder/app__1.0.0-beta';
    const result = updatePathWithNameAndVersion(oldPath, 'app', '1.0.0-rc1');
    expect(result).toBe('folder/app__1.0.0-rc1');
  });

  test('Should handle complex hash-like folder structure', () => {
    const oldPath = 'abc123XYZ456/def789/item-name__1.0.0';
    const result = updatePathWithNameAndVersion(oldPath, 'new-item', '1.5.0');
    expect(result).toBe('abc123XYZ456/def789/new-item__1.5.0');
  });
});

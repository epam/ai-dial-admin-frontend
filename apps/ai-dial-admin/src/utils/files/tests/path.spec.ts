import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import {
  changeFolderName,
  changePath,
  checkPaths,
  checkSelectedPath,
  extractVersionByPath,
  getFolderNameAndPath,
  toFileSelectPath,
  toEntitySelectPath,
  getListOfPathsToBulkDelete,
  getListOfPathsToMove,
  getPathSegments,
  isFolder,
  removeTrailingSlash,
  replacePathPrefix,
  updatePathWithName,
} from '@/src/utils/files/path';
import { describe, expect, test, vi } from 'vitest';
import * as findFolderChildrenModule from '../folder';

describe('Utils :: files :: changePath', () => {
  test('Should change folder path', () => {
    const res = changePath('folder1/folder2/all/folder', 'newPath');
    expect(res).toEqual('newPath/folder');
  });

  test('Should change path with duplicate name', () => {
    const res = changePath('folder1/folder2/file.txt', 'newPath', 'file(1).txt');
    expect(res).toEqual('newPath/file(1).txt');
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
    const res = getListOfPathsToMove({ name: 'name', path: 'prompts/public/name', folderId: 'public' }, null, [
      { name: 'name', path: 'path', folderId: 'public' },
      { name: 'name', path: 'path2', folderId: 'public' },
      { name: 'name', path: 'path3', folderId: 'public' },
      { name: 'name2', path: 'path4', folderId: 'public' },
    ]);
    expect(res).toEqual(['path', 'path2', 'path3']);
  });

  test('Should return correct list of paths from map', () => {
    const res = getListOfPathsToMove(
      { name: 'name', path: 'folder/name', folderId: 'folder' },
      {
        'folder/': [
          { name: 'name', path: 'path', folderId: 'public' },
          { name: 'name', path: 'path2', folderId: 'public' },
          { name: 'name', path: 'path3', folderId: 'public' },
          { name: 'name2', path: 'path4', folderId: 'public' },
        ],
      },
      null,
    );
    expect(res).toEqual(['path', 'path2', 'path3']);
  });
  test('Should return correct list of paths from map with extension', () => {
    const res = getListOfPathsToMove(
      { name: 'name.txt', path: 'folder/name.txt', folderId: 'folder' },
      {
        'folder/': [
          { name: 'name.txt', path: 'path', folderId: 'public' },
          { name: 'name.txt', path: 'path2', folderId: 'public' },
          { name: 'name.txt', path: 'path3', folderId: 'public' },
          { name: 'name2.txt', path: 'path4', folderId: 'public' },
        ],
      },
      null,
      true,
    );
    expect(res).toEqual([]);
  });

  test('Should return  empty array', () => {
    const res = getListOfPathsToMove(
      { name: 'name.txt', path: 'folder/name.txt', folderId: 'folder' },
      null,
      null,
      true,
    );
    expect(res).toEqual([]);
  });
});

describe('Utils :: files :: getListOfPathsToBulkDelete', () => {
  test('Should return all paths from a record of DialFiles', () => {
    const record = {
      'folder1/': [
        { path: 'folder1/file1', name: 'file1', folderId: 'folder1', nodeType: DialFileNodeType.ITEM },
        { path: 'folder1/file2', name: 'file2', folderId: 'folder1', nodeType: DialFileNodeType.ITEM },
      ],
      'folder2/': [{ path: 'folder2/file3', name: 'file3', folderId: 'folder1', nodeType: DialFileNodeType.ITEM }],
    };

    const res = getListOfPathsToBulkDelete(record);
    expect(res).toEqual([{ path: 'folder1/file1' }, { path: 'folder1/file2' }, { path: 'folder2/file3' }]);
  });

  test('Should return all paths from a record of DialPrompts', () => {
    const record = {
      'folder1/': [
        { path: 'folder1/prompt1', name: 'prompt1', folderId: 'folder1', version: '1.0', content: 'Write a poem' },
        { path: 'folder1/prompt2', name: 'prompt2', folderId: 'folder1', version: '1.0', content: 'Write code' },
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
        folderId: 'root',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
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
        folderId: 'root',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
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
        folderId: 'root',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
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
        folderId: '/',
        items: [],
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

describe('Utils :: files :: replacePathPrefix', () => {
  test('Should replace prefix when both sides have trailing slashes', () => {
    const result = replacePathPrefix('old/a__1', 'old/', 'new/');
    expect(result).toBe('new/a__1');
  });

  test('Should replace prefix when oldPrefix has no trailing slash', () => {
    const result = replacePathPrefix('old/a__1', 'old', 'new/');
    expect(result).toBe('new/a__1');
  });

  test('Should replace prefix when newPrefix has no trailing slash', () => {
    const result = replacePathPrefix('old/a__1', 'old/', 'new');
    expect(result).toBe('new/a__1');
  });

  test('Should replace prefix when neither side has a trailing slash', () => {
    const result = replacePathPrefix('old/a__1', 'old', 'new');
    expect(result).toBe('new/a__1');
  });

  test('Should not glue the destination folder name onto the descendant name', () => {
    const result = replacePathPrefix('als_code_apps/als-quickapp20', 'als_code_apps', 'renamed_apps');
    expect(result).toBe('renamed_apps/als-quickapp20');
  });

  test('Should rewrite a descendant one level deep inside the folder', () => {
    const result = replacePathPrefix('old/sub/file', 'old/', 'new/');
    expect(result).toBe('new/sub/file');
  });

  test('Should rewrite the .dial_folder marker resource, keeping it nested under the new folder', () => {
    const result = replacePathPrefix('old/.dial_folder', 'old/', 'new/');
    expect(result).toBe('new/.dial_folder');
  });

  test('Should preserve a trailing slash present on the input path', () => {
    const result = replacePathPrefix('old/sub/', 'old/', 'new/');
    expect(result).toBe('new/sub/');
  });

  test('Should throw when fullPath does not start with oldPrefix as a segment-aligned prefix', () => {
    expect(() => replacePathPrefix('other/a__1', 'old/', 'new/')).toThrow();
  });

  test('Should throw when oldPrefix is a substring look-alike but not an actual ancestor segment', () => {
    expect(() => replacePathPrefix('bucket/foobar/a__1', 'bucket/foo', 'bucket/renamed')).toThrow();
  });
});

describe('Utils :: files :: updatePathWithName', () => {
  test('Should update the last segment to the new name', () => {
    const result = updatePathWithName('folder/my-prompt', 'renamed-prompt');
    expect(result).toBe('folder/renamed-prompt');
  });

  test('Should keep a `__` in the new name verbatim — it is part of the name, not a version', () => {
    const result = updatePathWithName('folder/my-prompt', 'renamed__1.0.0');
    expect(result).toBe('folder/renamed__1.0.0');
  });

  test('Should replace a name that carried a `__` suffix verbatim', () => {
    const result = updatePathWithName('folder/my-prompt__1.0.0', 'renamed-prompt');
    expect(result).toBe('folder/renamed-prompt');
  });

  test('Should handle a nested folder structure', () => {
    const result = updatePathWithName('root/subfolder/nested/prompt', 'new-name');
    expect(result).toBe('root/subfolder/nested/new-name');
  });

  test('Should handle a bare name with no folder', () => {
    const result = updatePathWithName('my-prompt', 'renamed-prompt');
    expect(result).toBe('renamed-prompt');
  });
});

describe('Utils :: files :: extractVersionByPath', () => {
  test('parses only the final delimiter in the final leaf', () => {
    expect(extractVersionByPath('public/folder__ignored/assistant__internal__release candidate')).toBe(
      'release candidate',
    );
    expect(extractVersionByPath('public/folder__ignored/assistant')).toBeNull();
    expect(extractVersionByPath('public/assistant__未来 #?%')).toBe('未来 #?%');
  });
  test('Should extract version from path with double underscore', () => {
    const path = 'folder/item__1.0.0';
    const result = extractVersionByPath(path);
    expect(result).toBe('1.0.0');
  });

  test('Should return null when no version separator found', () => {
    const path = 'folder/item';
    const result = extractVersionByPath(path);
    expect(result).toBeNull();
  });

  test('Should extract version when path ends with version', () => {
    const path = 'item__1.0.0';
    const result = extractVersionByPath(path);
    expect(result).toBe('1.0.0');
  });

  test('Should handle empty string', () => {
    const path = '';
    const result = extractVersionByPath(path);
    expect(result).toBeNull();
  });

  test('Should handle path with only double underscore', () => {
    const path = 'item__';
    const result = extractVersionByPath(path);
    expect(result).toBeNull();
  });
});

describe('Utils :: files :: toFileSelectPath', () => {
  test('returns a storage path unchanged', () => {
    expect(toFileSelectPath('public/docs/file.txt')).toBe('public/docs/file.txt');
    expect(toFileSelectPath('applications/suite-1/files/notes.pdf')).toBe('applications/suite-1/files/notes.pdf');
  });

  test('returns empty for leftover schema values that are not paths', () => {
    expect(toFileSelectPath(true)).toBe('');
    expect(toFileSelectPath(false)).toBe('');
    expect(toFileSelectPath(12)).toBe('');
    expect(toFileSelectPath({ path: 'public/a' })).toBe('');
    expect(toFileSelectPath('hello')).toBe('');
    expect(toFileSelectPath('true')).toBe('');
    expect(toFileSelectPath('file.pdf')).toBe('');
  });

  test('returns empty for missing values', () => {
    expect(toFileSelectPath('')).toBe('');
    expect(toFileSelectPath(null)).toBe('');
    expect(toFileSelectPath(undefined)).toBe('');
  });
});

describe('Utils :: files :: toFileSelectPath — skill references', () => {
  test('rejects a skill reference so it never reaches the file picker', () => {
    expect(toFileSelectPath('skills/public/my-skill')).toBe('');
  });
});

describe('Utils :: files :: toEntitySelectPath', () => {
  test('returns a skill reference unchanged', () => {
    expect(toEntitySelectPath('skills/public/my-skill', 'skills/')).toBe('skills/public/my-skill');
    expect(toEntitySelectPath('skills/public/team/my-skill', 'skills/')).toBe('skills/public/team/my-skill');
  });

  test('returns empty for a file path or any other stale value', () => {
    expect(toEntitySelectPath('files/public/report.pdf', 'skills/')).toBe('');
    expect(toEntitySelectPath('public/docs/file.txt', 'skills/')).toBe('');
    expect(toEntitySelectPath('hello', 'skills/')).toBe('');
    expect(toEntitySelectPath(true, 'skills/')).toBe('');
    expect(toEntitySelectPath({ path: 'skills/a' }, 'skills/')).toBe('');
  });

  test('returns empty for missing values', () => {
    expect(toEntitySelectPath('', 'skills/')).toBe('');
    expect(toEntitySelectPath(null, 'skills/')).toBe('');
    expect(toEntitySelectPath(undefined, 'skills/')).toBe('');
  });
});

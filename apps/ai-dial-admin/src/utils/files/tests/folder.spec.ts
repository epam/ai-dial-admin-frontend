import { DialFileNodeType } from '@/src/models/dial/file';
import { describe, expect, test } from 'vitest';
import { fillChildren, fillFolderRules, getFolderName, mergeFiles } from '../folder';

describe('Context Utils :: getFolderName', () => {
  test('Should return correct folder name with trailing slash', () => {
    const res = getFolderName('public/folder1/');
    expect(res).toEqual('folder1');
  });
  test('Should return correct folder name without trailing slash', () => {
    const res = getFolderName('public/folder1');
    expect(res).toEqual('folder1');
  });
});

describe('Context Utils :: fillChildren', () => {
  test('Should return correct folder array with names', () => {
    const res = fillChildren([{ path: 'public/folder1' }, { path: 'public/folder2' }]);
    expect(res).toEqual([
      { path: 'public/folder1', name: 'folder1' },
      { path: 'public/folder2', name: 'folder2' },
    ]);
  });
});

describe('Context Utils :: mergeFiles', () => {
  test('should create a new folder node if existingFiles is empty', () => {
    const newFiles = [{ name: 'file1', path: 'somePath/folder/file1', nodeType: DialFileNodeType.ITEM }];
    const result = mergeFiles([], newFiles, 'somePath/folder');

    expect(result).toEqual([
      {
        name: 'folder',
        path: 'somePath/folder',
        nodeType: DialFileNodeType.FOLDER,
        children: [{ name: 'file1', path: 'somePath/folder/file1', nodeType: DialFileNodeType.ITEM }],
      },
    ]);
  });
  test('should merge new files into the folder with matching path', () => {
    const existing = [
      {
        name: 'folder',
        path: 'somePath/folder',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ];
    const newFiles = [{ name: 'file1', path: 'somePath/folder/file1', nodeType: DialFileNodeType.ITEM }];
    const result = mergeFiles(existing, newFiles, 'somePath/folder');

    expect(result[0]).toEqual({
      name: 'folder',
      path: 'somePath/folder',
      nodeType: DialFileNodeType.FOLDER,
      children: [{ name: 'file1', path: 'somePath/folder/file1', nodeType: DialFileNodeType.ITEM }],
    });
  });

  test('should merge files into deeply nested folder', () => {
    const existing = [
      {
        name: 'root',
        path: 'somePath',
        nodeType: DialFileNodeType.FOLDER,
        children: [
          {
            name: 'folder1',
            path: 'somePath/folder1',
            nodeType: DialFileNodeType.FOLDER,
            children: [
              {
                name: 'folder2',
                path: 'somePath/folder1/folder2',
                nodeType: DialFileNodeType.FOLDER,
                children: [],
              },
            ],
          },
        ],
      },
    ];
    const newFiles = [{ name: 'file2', path: 'somePath/folder1/folder2/file2', nodeType: DialFileNodeType.ITEM }];
    const result = mergeFiles(existing, newFiles, 'somePath/folder1/folder2');

    const folder2 = result[0].children?.[0].children?.[0];
    expect(folder2?.path).toBe('somePath/folder1/folder2');
    expect(folder2?.children).toEqual([
      { name: 'file2', path: 'somePath/folder1/folder2/file2', nodeType: DialFileNodeType.ITEM },
    ]);
  });

  test('should not assign children if newFiles is null', () => {
    const existing = [
      {
        name: 'folder',
        path: 'somePath/folder',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ];
    const result = mergeFiles(existing, null, 'somePath/folder');

    expect(result[0].children).toBeUndefined();
  });
});

describe('Context Utils :: fillFolderRules', () => {
  test('creates all folder levels when rules is empty', () => {
    const path = 'folder/folder2/lastFolder/';
    const rules = {};

    const result = fillFolderRules(path, rules);

    expect(result).toEqual({
      'folder/': [],
      'folder/folder2/': [],
      'folder/folder2/lastFolder/': [],
    });
  });

  test('preserves existing rules', () => {
    const path = 'folder/folder2/lastFolder/';
    const rules = {
      'folder/': [{ name: 'rule1' }],
      'folder/folder2/lastFolder/': [{ name: 'rule2' }],
    };

    const result = fillFolderRules(path, rules);

    expect(result).toEqual({
      'folder/': [{ name: 'rule1' }],
      'folder/folder2/': [],
      'folder/folder2/lastFolder/': [{ name: 'rule2' }],
    });
  });

  test('does not override existing entries', () => {
    const path = 'folder/folder2/';
    const rules = {
      'folder/folder2/': [{ name: 'doNotOverride' }],
    };

    const result = fillFolderRules(path, rules);

    expect(result['folder/folder2/']).toEqual([{ name: 'doNotOverride' }]);
  });

  test('returns existing entries unchanged if all paths are present', () => {
    const path = 'folder/folder2/';
    const rules = {
      'folder/': [],
      'folder/folder2/': [],
    };

    const result = fillFolderRules(path, rules);

    expect(result).toEqual(rules);
  });

  test('returns existing entries unchanged if all paths are present', () => {
    const path = 'folder/folder2/';
    const rules = {
      'folder/': [],
      'folder/folder2/': [],
    };

    const result = fillFolderRules(path, null);

    expect(result).toEqual(rules);
  });
});

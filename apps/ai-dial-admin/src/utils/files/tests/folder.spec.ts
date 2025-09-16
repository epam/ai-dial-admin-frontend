import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { describe, expect, test } from 'vitest';
import {
  fillChildren,
  fillFolderRules,
  findFolderChildren,
  findFolderSiblings,
  getFolderName,
  mergeFiles,
} from '../folder';

describe('Folder Utils :: getFolderName', () => {
  test('Should return correct folder name with trailing slash', () => {
    const res = getFolderName('public/folder1/');
    expect(res).toEqual('folder1');
  });
  test('Should return correct folder name without trailing slash', () => {
    const res = getFolderName('public/folder1');
    expect(res).toEqual('folder1');
  });
});

describe('Folder Utils :: fillChildren', () => {
  test('Should return correct folder array with names', () => {
    const res = fillChildren([{ path: 'public/folder1' }, { path: 'public/folder2' }]);
    expect(res).toEqual([
      { path: 'public/folder1', name: 'folder1' },
      { path: 'public/folder2', name: 'folder2' },
    ]);
  });
});

describe('Folder Utils :: mergeFiles', () => {
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

describe('Folder Utils :: fillFolderRules', () => {
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

describe('Folder Utils :: findFolderSiblings', () => {
  const mockTree: DialFolder = {
    path: '/root',
    nodeType: DialFileNodeType.FOLDER,
    children: [
      {
        path: '/root/folder1',
        nodeType: DialFileNodeType.FOLDER,
        children: [
          {
            path: '/root/folder1/sub1',
            nodeType: DialFileNodeType.FOLDER,
            children: [],
          },
        ],
      },
      {
        path: '/root/folder2',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
      {
        path: '/root/file1.txt',
        nodeType: DialFileNodeType.FILE,
      },
    ],
  };

  test('returns sibling folders for a folder with siblings', () => {
    const result = findFolderSiblings('/root/folder1', mockTree);
    expect(result).toEqual(['/root/folder2']);
  });

  test('returns empty array if folder has no siblings', () => {
    const result = findFolderSiblings('/root/folder2', mockTree);
    expect(result).toEqual(['/root/folder1']);
  });

  test('returns empty array if folder is root', () => {
    const result = findFolderSiblings('/root', mockTree);
    expect(result).toEqual([]);
  });

  test('returns empty array if folder path not found', () => {
    const result = findFolderSiblings('/nonexistent', mockTree);
    expect(result).toEqual([]);
  });

  test('does not include FILE siblings', () => {
    const folderWithFileSibling: DialFolder = {
      path: '/parent',
      nodeType: DialFileNodeType.FOLDER,
      children: [
        {
          path: '/parent/folderA',
          nodeType: DialFileNodeType.FOLDER,
          children: [],
        },
        {
          path: '/parent/fileA.txt',
          nodeType: DialFileNodeType.FILE,
        },
      ],
    };
    const result = findFolderSiblings('/parent/folderA', folderWithFileSibling);
    expect(result).toEqual([]);
  });
});

describe('Folder Utils :: findFolderChildren', () => {
  const mockTree: DialFolder = {
    path: '/root',
    nodeType: DialFileNodeType.FOLDER,
    children: [
      {
        path: '/root/folder1',
        nodeType: DialFileNodeType.FOLDER,
        children: [
          {
            path: '/root/folder1/sub1',
            nodeType: DialFileNodeType.FOLDER,
            children: [],
          },
          {
            path: '/root/folder1/file1.txt',
            nodeType: DialFileNodeType.FILE,
          },
        ],
      },
      {
        path: '/root/folder2',
        nodeType: DialFileNodeType.FOLDER,
        children: [],
      },
    ],
  };

  test('returns children folder paths for a folder with children', () => {
    const result = findFolderChildren('/root/folder1', mockTree);
    expect(result).toEqual(['/root/folder1/sub1']);
  });

  test('returns empty array if folder has no children', () => {
    const result = findFolderChildren('/root/folder2', mockTree);
    expect(result).toEqual([]);
  });

  test('returns empty array if folder has only file children', () => {
    const folderWithOnlyFiles: DialFolder = {
      path: '/files',
      nodeType: DialFileNodeType.FOLDER,
      children: [
        {
          path: '/files/fileA.txt',
          nodeType: DialFileNodeType.FILE,
        },
        {
          path: '/files/fileB.md',
          nodeType: DialFileNodeType.FILE,
        },
      ],
    };
    const result = findFolderChildren('/files', folderWithOnlyFiles);
    expect(result).toEqual([]);
  });

  test('returns empty array if folder path not found', () => {
    const result = findFolderChildren('/nonexistent', mockTree);
    expect(result).toEqual([]);
  });

  test('returns empty array if root has no children', () => {
    const emptyRoot: DialFolder = {
      path: '/empty',
      nodeType: DialFileNodeType.FOLDER,
      children: [],
    };
    const result = findFolderChildren('/empty', emptyRoot);
    expect(result).toEqual([]);
  });

  test('returns nested children correctly from deeper nodes', () => {
    const result = findFolderChildren('/root', mockTree);
    expect(result).toEqual(['/root/folder1', '/root/folder2']);
  });
});

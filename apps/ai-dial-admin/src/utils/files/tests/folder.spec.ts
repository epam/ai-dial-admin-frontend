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
      {
        name: 'folder1',
        parentPath: 'public/',
        path: 'public/folder1',
        permissions: ['WRITE', 'READ'],
      },
      {
        name: 'folder2',
        parentPath: 'public/',
        path: 'public/folder2',
        permissions: ['WRITE', 'READ'],
      },
    ]);
  });

  test('Should preserve existing children items for folders', () => {
    const existingChildren = [
      {
        path: 'public/folder1',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            name: 'subfile',
            path: 'public/folder1/subfile',
            nodeType: DialFileNodeType.ITEM,
          },
        ],
      },
    ];
    const res = fillChildren([{ path: 'public/folder1', nodeType: DialFileNodeType.FOLDER }], existingChildren);
    expect(res[0].items).toEqual([
      {
        name: 'subfile',
        path: 'public/folder1/subfile',
        nodeType: DialFileNodeType.ITEM,
      },
    ]);
  });

  test('Should not add items to non-folder node types', () => {
    const existingChildren = [
      {
        path: 'public/file.txt',
        nodeType: DialFileNodeType.ITEM,
        items: [
          {
            name: 'shouldNotExist',
            path: 'public/file.txt/shouldNotExist',
            nodeType: DialFileNodeType.ITEM,
          },
        ],
      },
    ];
    const res = fillChildren([{ path: 'public/file.txt', nodeType: DialFileNodeType.ITEM }], existingChildren);
    expect(res[0].items).toBeUndefined();
  });

  test('Should handle case when existingChildren is undefined', () => {
    const res = fillChildren([{ path: 'public/folder1', nodeType: DialFileNodeType.FOLDER }], undefined);
    expect(res[0].items).toBeUndefined();
  });

  test('Should handle case when existing children path does not match', () => {
    const existingChildren = [
      {
        path: 'public/differentFolder',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            name: 'subfile',
            path: 'public/differentFolder/subfile',
            nodeType: DialFileNodeType.ITEM,
          },
        ],
      },
    ];
    const res = fillChildren([{ path: 'public/folder1', nodeType: DialFileNodeType.FOLDER }], existingChildren);
    expect(res[0].items).toBeUndefined();
  });
});

describe('Folder Utils :: mergeFiles', () => {
  test('should create a new folder node if existingFiles is empty', () => {
    const newFiles = [
      {
        name: 'file1',
        path: 'somePath/folder/file1',
        parentPath: 'somePath/folder/',
        nodeType: DialFileNodeType.ITEM,
        permissions: ['WRITE', 'READ'],
      },
    ];
    const result = mergeFiles([], newFiles, 'somePath/folder');

    expect(result).toEqual([
      {
        name: 'folder',
        path: 'somePath/folder',
        nodeType: DialFileNodeType.FOLDER,
        permissions: ['WRITE', 'READ'],
        items: [
          {
            name: 'file1',
            path: 'somePath/folder/file1',
            nodeType: DialFileNodeType.ITEM,
            parentPath: 'somePath/folder/',
            permissions: ['WRITE', 'READ'],
          },
        ],
      },
    ]);
  });
  test('should merge new files into the folder with matching path', () => {
    const existing = [
      {
        name: 'folder',
        path: 'somePath/folder',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
    ];
    const newFiles = [
      {
        name: 'file1',
        path: 'somePath/folder/file1',
        parentPath: 'somePath/folder/',
        nodeType: DialFileNodeType.ITEM,
        permissions: ['WRITE', 'READ'],
      },
    ];
    const result = mergeFiles(existing, newFiles, 'somePath/folder');

    expect(result[0]).toEqual({
      name: 'folder',
      path: 'somePath/folder',
      nodeType: DialFileNodeType.FOLDER,
      items: [
        {
          name: 'file1',
          path: 'somePath/folder/file1',
          nodeType: DialFileNodeType.ITEM,
          parentPath: 'somePath/folder/',
          permissions: ['WRITE', 'READ'],
        },
      ],
    });
  });

  test('should merge files into deeply nested folder', () => {
    const existing = [
      {
        name: 'root',
        path: 'somePath',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            name: 'folder1',
            path: 'somePath/folder1',
            nodeType: DialFileNodeType.FOLDER,
            items: [
              {
                name: 'folder2',
                path: 'somePath/folder1/folder2',
                nodeType: DialFileNodeType.FOLDER,
                items: [],
              },
            ],
          },
        ],
      },
    ];
    const newFiles = [{ name: 'file2', path: 'somePath/folder1/folder2/file2', nodeType: DialFileNodeType.ITEM }];
    const result = mergeFiles(existing, newFiles, 'somePath/folder1/folder2');

    const folder2 = result[0].items?.[0].items?.[0];
    expect(folder2?.path).toBe('somePath/folder1/folder2');
    expect(folder2?.items).toEqual([
      {
        name: 'file2',
        path: 'somePath/folder1/folder2/file2',
        parentPath: 'somePath/folder1/folder2/',
        nodeType: DialFileNodeType.ITEM,
        permissions: ['WRITE', 'READ'],
      },
    ]);
  });

  test('should not assign items if newFiles is null', () => {
    const existing = [
      {
        name: 'folder',
        path: 'somePath/folder',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
    ];
    const result = mergeFiles(existing, null, 'somePath/folder');

    expect(result[0].items).toBeUndefined();
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
    items: [
      {
        path: '/root/folder1',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            path: '/root/folder1/sub1',
            nodeType: DialFileNodeType.FOLDER,
            items: [],
          },
        ],
      },
      {
        path: '/root/folder2',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
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
      items: [
        {
          path: '/parent/folderA',
          nodeType: DialFileNodeType.FOLDER,
          items: [],
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
    items: [
      {
        path: '/root/folder1',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            path: '/root/folder1/sub1',
            nodeType: DialFileNodeType.FOLDER,
            items: [],
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
        items: [],
      },
    ],
  };

  test('returns items folder paths for a folder with items', () => {
    const result = findFolderChildren('/root/folder1', mockTree);
    expect(result).toEqual(['/root/folder1/sub1']);
  });

  test('returns empty array if folder has no items', () => {
    const result = findFolderChildren('/root/folder2', mockTree);
    expect(result).toEqual([]);
  });

  test('returns empty array if folder has only file items', () => {
    const folderWithOnlyFiles: DialFolder = {
      path: '/files',
      nodeType: DialFileNodeType.FOLDER,
      items: [
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

  test('returns empty array if root has no items', () => {
    const emptyRoot: DialFolder = {
      path: '/empty',
      nodeType: DialFileNodeType.FOLDER,
      items: [],
    };
    const result = findFolderChildren('/empty', emptyRoot);
    expect(result).toEqual([]);
  });

  test('returns nested items correctly from deeper nodes', () => {
    const result = findFolderChildren('/root', mockTree);
    expect(result).toEqual(['/root/folder1', '/root/folder2']);
  });
});

import { describe, expect, test } from 'vitest';

import { mergeFolderTrees, toFolderTree } from '../folder-tree';

describe('Server :: Folders :: folder-tree :: toFolderTree', () => {
  test('builds a folder-only tree, dropping ITEM children', () => {
    const node = {
      url: 'applications/public/sub/',
      parentPath: 'public/',
      bucket: 'bucket-1',
      nodeType: 'FOLDER',
      items: [
        { nodeType: 'ITEM', url: 'applications/public/sub/app__1' },
        { nodeType: 'FOLDER', url: 'applications/public/sub/nested/', items: [] },
      ],
    };

    const result = toFolderTree(node, 'applications/');

    expect(result).toMatchObject({ name: 'sub', path: 'public/sub/', folderId: 'public/', bucket: 'bucket-1' });
    expect(result.items).toHaveLength(1);
    expect(result.items?.[0]).toMatchObject({ name: 'nested', path: 'public/sub/nested/' });
  });

  test('handles a root-bucket folder with no parent segment', () => {
    const node = { url: 'applications/public/', nodeType: 'FOLDER', items: [] };

    const result = toFolderTree(node, 'applications/');

    expect(result).toMatchObject({ name: 'public', path: 'public/', folderId: '' });
  });

  test('reconstructs a multi-level hierarchy from a flat items list (Core returns every descendant flat, not nested)', () => {
    // Confirmed live against a real Core instance: recursive=true puts every descendant
    // FOLDER/ITEM entry directly in the root's items[], regardless of depth — a deeply
    // nested folder's own `items` field is empty/absent. toFolderTree must reconstruct the
    // hierarchy by grouping on each entry's folderId, not by trusting nested `items`.
    const node = {
      url: 'files/public/root/',
      nodeType: 'FOLDER',
      items: [
        { nodeType: 'ITEM', url: 'files/public/root/doc.txt' },
        { nodeType: 'FOLDER', url: 'files/public/root/mid/', items: [] },
        { nodeType: 'ITEM', url: 'files/public/root/mid/note.txt' },
        { nodeType: 'FOLDER', url: 'files/public/root/mid/deep/', items: [] },
        { nodeType: 'ITEM', url: 'files/public/root/mid/deep/leaf.txt' },
      ],
    };

    const result = toFolderTree(node, 'files/');

    expect(result).toMatchObject({ name: 'root', path: 'public/root/' });
    expect(result.items).toHaveLength(1);
    expect(result.items?.[0]).toMatchObject({ name: 'mid', path: 'public/root/mid/' });
    expect(result.items?.[0].items).toHaveLength(1);
    expect(result.items?.[0].items?.[0]).toMatchObject({ name: 'deep', path: 'public/root/mid/deep/' });
  });
});

describe('Server :: Folders :: folder-tree :: mergeFolderTrees', () => {
  const baseFolder = (overrides = {}) => ({
    name: 'sub',
    path: 'public/sub/',
    folderId: 'public/',
    nodeType: 'folder' as const,
    parentPath: 'public/',
    bucket: 'bucket-1',
    items: [],
    ...overrides,
  });

  test('merges items from multiple types into one combined tree', () => {
    const promptTree = baseFolder({ items: [baseFolder({ name: 'a', path: 'public/sub/a/' })] });
    const appTree = baseFolder({ items: [baseFolder({ name: 'b', path: 'public/sub/b/' })] });

    const result = mergeFolderTrees([promptTree, appTree]);

    expect(result?.items?.map((item) => item.name).sort()).toEqual(['a', 'b']);
  });

  test('ignores null entries (a type with no folder at this path)', () => {
    const promptTree = baseFolder();

    const result = mergeFolderTrees([promptTree, null, undefined]);

    expect(result).toMatchObject({ name: 'sub' });
  });

  test('returns null when no type has this folder', () => {
    expect(mergeFolderTrees([null, undefined])).toBeNull();
  });

  test('throws when two types disagree on folder metadata', () => {
    const promptTree = baseFolder({ bucket: 'bucket-1' });
    const appTree = baseFolder({ bucket: 'bucket-2' });

    expect(() => mergeFolderTrees([promptTree, appTree])).toThrow(/Inconsistent folder metadata/);
  });
});

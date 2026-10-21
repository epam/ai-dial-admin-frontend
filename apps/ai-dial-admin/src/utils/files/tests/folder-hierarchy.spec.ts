import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { describe, expect, test, vi } from 'vitest';
import { loadFolderHierarchy } from '../folder-hierarchy';

const createItem = (path: string) =>
  ({ name: path.split('/').at(-1), path, nodeType: DialFileNodeType.ITEM, bucket: BucketType.Public }) as AssetListItem;

const createFolder = (path: string) =>
  ({
    name: path.split('/').filter(Boolean).at(-1),
    path,
    nodeType: DialFileNodeType.FOLDER,
    bucket: BucketType.Public,
  }) as AssetListItem;

// Tree nodes carry their children in `items`, which the row type does not declare.
const getChildren = (node?: AssetListItem | DialFile) => (node as DialFile | undefined)?.items;

const fetchBranch = (path: string) =>
  Promise.resolve(path === 'a/' ? [createFolder('a/b/'), createItem('a/x')] : [createItem('a/b/leaf')]);

describe('Folder Hierarchy :: loadFolderHierarchy', () => {
  test('Should build only the branch to the target folder by default', async () => {
    const result = await loadFolderHierarchy({ fullPath: 'a/b/', fetchByPath: fetchBranch });

    expect(result?.files).toHaveLength(1);
    expect(result?.files[0].path).toBe('a/');
    expect(getChildren(result?.files[0])?.map((child) => child.path)).toEqual(['a/b/']);
  });

  test('Should keep every entry of each level when fullTree is set', async () => {
    const result = await loadFolderHierarchy({ fullPath: 'a/b/', fullTree: true, fetchByPath: fetchBranch });

    expect(getChildren(result?.files[0])?.map((child) => child.path)).toEqual(['a/b/', 'a/x']);
    expect(
      getChildren(getChildren(result?.files[0])?.find((child) => child.path === 'a/b/'))?.map((child) => child.path),
    ).toEqual(['a/b/leaf']);
  });

  test('Should report the expanded folders, the cached items and the selected folder', async () => {
    const result = await loadFolderHierarchy({ fullPath: 'a/b/', fetchByPath: fetchBranch });

    expect([...(result?.expandedFolders ?? [])]).toEqual(['a/', 'a/b/']);
    expect(result?.fetchedFoldersData).toEqual({
      'a/': [createItem('a/x')],
      'a/b/': [createItem('a/b/leaf')],
    });
    expect(result?.filePath).toBe('a/b/');
  });

  test('Should fetch each level once, from the top', async () => {
    const fetchByPath = vi.fn(fetchBranch);

    await loadFolderHierarchy({ fullPath: 'a/b/', fetchByPath });

    expect(fetchByPath.mock.calls).toEqual([['a/'], ['a/b/']]);
  });

  test('Should add a placeholder named after the missing folder when a level is empty', async () => {
    const result = await loadFolderHierarchy<AssetListItem>({
      fullPath: 'a/b/',
      fetchByPath: () => Promise.resolve([]),
    });

    expect(getChildren(result?.files[0])).toMatchObject([
      { name: 'b', path: 'a/b/', nodeType: DialFileNodeType.FOLDER },
    ]);
  });

  test('Should name the placeholder after the current segment when the next folder is missing from a non-empty level', async () => {
    const result = await loadFolderHierarchy({
      fullPath: 'a/b/',
      fetchByPath: () => Promise.resolve([createItem('a/x')]),
    });

    expect(getChildren(result?.files[0])).toMatchObject([
      { name: 'a', path: 'a/b/', nodeType: DialFileNodeType.FOLDER },
    ]);
  });

  test('Should treat a null level as empty', async () => {
    const result = await loadFolderHierarchy<AssetListItem>({
      fullPath: 'a/',
      fetchByPath: () => Promise.resolve(null),
    });

    expect(result?.fetchedFoldersData).toEqual({ 'a/': [] });
  });

  test('Should return null and stop walking as soon as a level fails', async () => {
    const fetchByPath = vi.fn((path: string) => Promise.resolve(path === 'a/' ? undefined : []));

    const result = await loadFolderHierarchy({ fullPath: 'a/b/c/', fetchByPath });

    expect(result).toBeNull();
    expect(fetchByPath).toHaveBeenCalledOnce();
  });

  test('Should return an empty result for a path with no segments', async () => {
    const fetchByPath = vi.fn();

    const result = await loadFolderHierarchy({ fullPath: '/', fetchByPath });

    expect(fetchByPath).not.toHaveBeenCalled();
    expect(result).toEqual({
      files: [],
      fetchedFoldersData: {},
      expandedFolders: new Set(),
      filePath: '',
    });
  });
});

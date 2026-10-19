import { DEFAULT_ROOT_FOLDER_PERMISSIONS } from '@/src/constants/file';
import { AssetListItem, BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { describe, expect, test } from 'vitest';
import { buildRootNodes, createFolderNode, toConfigFileItems } from '../folder-nodes';

const createItem = (path: string) =>
  ({ name: path.split('/').at(-1), path, nodeType: DialFileNodeType.ITEM, bucket: BucketType.Public }) as AssetListItem;

// Tree nodes carry their children in `items`, which the row type does not declare.
const getChildren = (node?: AssetListItem | DialFile) => (node as DialFile | undefined)?.items;

describe('Folder Nodes :: createFolderNode', () => {
  test('Should mark the node as a folder and keep the given fields', () => {
    expect(createFolderNode({ name: 'a', path: 'a/' })).toEqual({
      name: 'a',
      path: 'a/',
      nodeType: DialFileNodeType.FOLDER,
    });
  });

  test('Should override a node type carried by the given fields', () => {
    expect(createFolderNode({ path: 'a/', nodeType: DialFileNodeType.ITEM })).toMatchObject({
      nodeType: DialFileNodeType.FOLDER,
    });
  });
});

describe('Folder Nodes :: toConfigFileItems', () => {
  test('Should map every name to a platform item of the file source', () => {
    expect(toConfigFileItems(['one', 'two'])).toEqual([
      {
        name: 'one',
        path: 'one',
        nodeType: DialFileNodeType.ITEM,
        bucket: BucketType.Platform,
        entitySource: EntitySource.File,
      },
      {
        name: 'two',
        path: 'two',
        nodeType: DialFileNodeType.ITEM,
        bucket: BucketType.Platform,
        entitySource: EntitySource.File,
      },
    ]);
  });

  test('Should return an empty array for no names', () => {
    expect(toConfigFileItems([])).toEqual([]);
  });
});

describe('Folder Nodes :: buildRootNodes', () => {
  test('Should build one folder node per path, in the given order', () => {
    const nodes = buildRootNodes(['platform/', 'public/'], [[createItem('platform/a')], [createItem('public/b')]]);

    expect(nodes.map((node) => node.path)).toEqual(['platform/', 'public/']);
    expect(nodes[0]).toMatchObject({
      name: 'platform',
      nodeType: DialFileNodeType.FOLDER,
      permissions: DEFAULT_ROOT_FOLDER_PERMISSIONS,
    });
  });

  test('Should fill each node with its own listing', () => {
    const [platform, publicRoot] = buildRootNodes(
      ['platform/', 'public/'],
      [[createItem('platform/a')], [createItem('public/b'), createItem('public/c')]],
    );

    expect(getChildren(platform)?.map((child) => child.path)).toEqual(['platform/a']);
    expect(getChildren(publicRoot)?.map((child) => child.path)).toEqual(['public/b', 'public/c']);
  });

  test('Should use the file source for the file root and the resource source otherwise', () => {
    const [fileRoot, resourceRoot] = buildRootNodes<AssetListItem>(['file/', 'public/'], [[], []]);

    expect(fileRoot.entitySource).toBe(EntitySource.File);
    expect(resourceRoot.entitySource).toBe(EntitySource.Resource);
  });

  test('Should treat a missing or failed listing as empty', () => {
    const [nullRoot, undefinedRoot] = buildRootNodes<AssetListItem>(['a/', 'b/'], [null, undefined]);

    expect(getChildren(nullRoot)).toEqual([]);
    expect(getChildren(undefinedRoot)).toEqual([]);
  });
});

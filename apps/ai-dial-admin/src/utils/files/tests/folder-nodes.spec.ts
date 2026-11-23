import { BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { describe, expect, test } from 'vitest';
import { createFolderNode, toConfigFileItems } from '../folder-nodes';

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

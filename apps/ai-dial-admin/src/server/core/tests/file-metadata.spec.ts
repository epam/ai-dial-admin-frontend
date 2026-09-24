import { describe, expect, test } from 'vitest';

import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { toFileList } from '../file-metadata';

describe('Server :: Core :: file-metadata', () => {
  test('toFileList returns an empty array when the node has no items', () => {
    expect(toFileList(null)).toEqual([]);
    expect(toFileList({ nodeType: DialFileNodeType.FOLDER } as DialFile)).toEqual([]);
  });

  test('toFileList derives path from url, stripping the files/ prefix and decoding', () => {
    const node = {
      nodeType: DialFileNodeType.FOLDER,
      items: [
        { name: 'file.txt', url: 'files/public/file.txt', etag: 'etag-1', nodeType: DialFileNodeType.ITEM },
        { name: 'My File.png', url: 'files/public/My%20File.png', nodeType: DialFileNodeType.FOLDER },
      ],
    } as unknown as DialFile;

    expect(toFileList(node)).toEqual([
      {
        name: 'file.txt',
        url: 'files/public/file.txt',
        etag: 'etag-1',
        path: 'public/file.txt',
        // Neither fixture sets parentPath/bucket, so folderId falls back to `ensureTrailingSlash(undefined)`.
        folderId: '/',
        nodeType: DialFileNodeType.ITEM,
      },
      {
        name: 'My File.png',
        url: 'files/public/My%20File.png',
        path: 'public/My File.png',
        folderId: '/',
        nodeType: DialFileNodeType.FOLDER,
      },
    ]);
  });

  test("toFileList derives folderId from a nested item's already bucket-qualified parentPath", () => {
    const node = {
      nodeType: DialFileNodeType.FOLDER,
      items: [
        {
          name: 'file.txt',
          url: 'files/public/folder1/file.txt',
          bucket: 'public',
          parentPath: 'public/folder1/',
          nodeType: DialFileNodeType.ITEM,
        },
      ],
    } as unknown as DialFile;

    expect(toFileList(node)[0]).toMatchObject({ folderId: 'public/folder1/' });
  });

  test('toFileList falls back to the bucket for a root-level item, whose parentPath comes back null', () => {
    const node = {
      nodeType: DialFileNodeType.FOLDER,
      items: [
        {
          name: 'file.txt',
          url: 'files/public/file.txt',
          bucket: 'public',
          parentPath: null,
          nodeType: DialFileNodeType.ITEM,
        },
      ],
    } as unknown as DialFile;

    expect(toFileList(node)[0]).toMatchObject({ folderId: 'public/' });
  });
});

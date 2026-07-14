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
        nodeType: DialFileNodeType.ITEM,
      },
      {
        name: 'My File.png',
        url: 'files/public/My%20File.png',
        path: 'public/My File.png',
        nodeType: DialFileNodeType.FOLDER,
      },
    ]);
  });
});

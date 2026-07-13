import { describe, expect, test, vi } from 'vitest';

import { fetchAllPages, flattenResourceUrls, gatherResourceUrls } from '../resource-walk';

describe('Server :: Folders :: resource-walk :: flattenResourceUrls', () => {
  test('collects ITEM node urls at the top level', () => {
    const node = {
      nodeType: 'FOLDER',
      items: [
        { nodeType: 'ITEM', url: 'prompts/folder/a__1' },
        { nodeType: 'ITEM', url: 'prompts/folder/b__1' },
      ],
    };

    expect(flattenResourceUrls(node)).toEqual(['prompts/folder/a__1', 'prompts/folder/b__1']);
  });

  test('reads every ITEM url from an already-flat list, ignoring FOLDER entries', () => {
    // Core's recursive=true response puts every descendant (ITEM and FOLDER, at any depth)
    // directly in the queried node's items[] — not nested inside each FOLDER's own items
    // (confirmed live; see the module header comment). flattenResourceUrls assumes the list
    // it's given is already flat/paginated (that's fetchAllPages's job), so it doesn't recurse.
    const node = {
      nodeType: 'FOLDER',
      items: [
        { nodeType: 'ITEM', url: 'prompts/folder/a__1' },
        { nodeType: 'FOLDER', url: 'prompts/folder/sub/' },
        { nodeType: 'ITEM', url: 'prompts/folder/sub/b__1' },
        { nodeType: 'FOLDER', url: 'prompts/folder/sub/deep/' },
        { nodeType: 'ITEM', url: 'prompts/folder/sub/deep/c__1' },
      ],
    };

    expect(flattenResourceUrls(node)).toEqual([
      'prompts/folder/a__1',
      'prompts/folder/sub/b__1',
      'prompts/folder/sub/deep/c__1',
    ]);
  });

  test('compares nodeType case-insensitively', () => {
    const node = { nodeType: 'FOLDER', items: [{ nodeType: 'item', url: 'files/folder/doc.txt' }] };

    expect(flattenResourceUrls(node)).toEqual(['files/folder/doc.txt']);
  });

  test('returns an empty array for a node with no items', () => {
    expect(flattenResourceUrls(null)).toEqual([]);
    expect(flattenResourceUrls({ nodeType: 'FOLDER' })).toEqual([]);
  });
});

describe('Server :: Folders :: resource-walk :: fetchAllPages', () => {
  test('returns a single page unchanged when there is no nextToken', async () => {
    const readPage = vi.fn().mockResolvedValue({ nodeType: 'FOLDER', items: [{ nodeType: 'ITEM', url: 'x' }] });

    const result = await fetchAllPages(readPage);

    expect(readPage).toHaveBeenCalledTimes(1);
    expect(readPage).toHaveBeenCalledWith();
    expect(result?.items).toEqual([{ nodeType: 'ITEM', url: 'x' }]);
  });

  test('follows nextToken until exhausted, accumulating items across pages', async () => {
    const readPage = vi
      .fn()
      .mockResolvedValueOnce({ nodeType: 'FOLDER', items: [{ nodeType: 'ITEM', url: 'a' }], nextToken: 'tok-1' })
      .mockResolvedValueOnce({ nodeType: 'FOLDER', items: [{ nodeType: 'ITEM', url: 'b' }], nextToken: 'tok-2' })
      .mockResolvedValueOnce({ nodeType: 'FOLDER', items: [{ nodeType: 'ITEM', url: 'c' }] });

    const result = await fetchAllPages(readPage);

    expect(readPage).toHaveBeenCalledTimes(3);
    expect(readPage).toHaveBeenNthCalledWith(2, 'tok-1');
    expect(readPage).toHaveBeenNthCalledWith(3, 'tok-2');
    expect(result?.items).toEqual([
      { nodeType: 'ITEM', url: 'a' },
      { nodeType: 'ITEM', url: 'b' },
      { nodeType: 'ITEM', url: 'c' },
    ]);
    expect(result?.nextToken).toBeUndefined();
  });

  test('returns null when the first page is null', async () => {
    const readPage = vi.fn().mockResolvedValue(null);

    expect(await fetchAllPages(readPage)).toBeNull();
  });
});

describe('Server :: Folders :: resource-walk :: gatherResourceUrls', () => {
  test('reads and flattens via the supplied callback, paginating until exhausted', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce({ nodeType: 'FOLDER', items: [{ nodeType: 'ITEM', url: 'x' }], nextToken: 'tok' })
      .mockResolvedValueOnce({ nodeType: 'FOLDER', items: [{ nodeType: 'ITEM', url: 'y' }] });

    const result = await gatherResourceUrls(read, 'folder/');

    expect(read).toHaveBeenCalledWith('folder/', undefined);
    expect(read).toHaveBeenCalledWith('folder/', 'tok');
    expect(result).toEqual(['x', 'y']);
  });

  test('swallows a not-found (thrown) read into an empty result', async () => {
    const read = vi.fn().mockRejectedValue(new Error('not found'));

    const result = await gatherResourceUrls(read, 'folder/');

    expect(result).toEqual([]);
  });

  test('a null read result also yields an empty result', async () => {
    const read = vi.fn().mockResolvedValue(null);

    const result = await gatherResourceUrls(read, 'folder/');

    expect(result).toEqual([]);
  });
});

import JSZip from 'jszip';
import { describe, expect, test, vi } from 'vitest';

import { buildFilesExportZip, resolveExportEntries, toExportArchivePath } from '../export';

const folderNode = (items: { url: string; nodeType: string }[] = []) => ({ nodeType: 'FOLDER', items });
const itemNode = (url: string) => ({ nodeType: 'ITEM', url });

describe('Server :: Files :: export :: resolveExportEntries', () => {
  test('includes a non-folder path directly with no export folder', async () => {
    const getNode = vi.fn().mockResolvedValue(itemNode('files/bucket/doc.txt'));
    const gatherDescendantUrls = vi.fn();

    const result = await resolveExportEntries(['bucket/doc.txt'], getNode, gatherDescendantUrls);

    expect(result).toEqual([{ storagePath: 'bucket/doc.txt', exportFolderPath: null }]);
    expect(gatherDescendantUrls).not.toHaveBeenCalled();
  });

  test('a path Core has no metadata for is still treated as a single file entry', async () => {
    const getNode = vi.fn().mockResolvedValue(null);
    const gatherDescendantUrls = vi.fn();

    const result = await resolveExportEntries(['bucket/doc.txt'], getNode, gatherDescendantUrls);

    expect(result).toEqual([{ storagePath: 'bucket/doc.txt', exportFolderPath: null }]);
  });

  test('expands a folder path into its descendants, tagged with the folder path', async () => {
    const getNode = vi.fn().mockResolvedValue(folderNode());
    const gatherDescendantUrls = vi.fn().mockResolvedValue(['files/bucket/folder/a.txt', 'files/bucket/folder/b.txt']);

    const result = await resolveExportEntries(['bucket/folder/'], getNode, gatherDescendantUrls);

    expect(gatherDescendantUrls).toHaveBeenCalledWith('bucket/folder/');
    expect(result).toEqual([
      { storagePath: 'bucket/folder/a.txt', exportFolderPath: 'bucket/folder/' },
      { storagePath: 'bucket/folder/b.txt', exportFolderPath: 'bucket/folder/' },
    ]);
  });

  test('recognizes a folder even when its selected path has no trailing slash', async () => {
    // The bug this guards against: folder-ness must come from Core's nodeType, not from the
    // path string's shape — a selection whose path doesn't end in '/' must still expand.
    const getNode = vi.fn().mockResolvedValue(folderNode());
    const gatherDescendantUrls = vi.fn().mockResolvedValue(['files/bucket/folder/a.txt']);

    const result = await resolveExportEntries(['bucket/folder'], getNode, gatherDescendantUrls);

    expect(result).toEqual([{ storagePath: 'bucket/folder/a.txt', exportFolderPath: 'bucket/folder' }]);
  });

  test('a folder with a nested subfolder includes the nested files, re-rooted under the folder path', async () => {
    // Regression: nested subfolder contents were previously excluded entirely (a deliberate
    // one-level-deep limit) — a folder selection must expand recursively at any depth.
    const getNode = vi.fn().mockResolvedValue(folderNode());
    const gatherDescendantUrls = vi
      .fn()
      .mockResolvedValue(['files/bucket/01folder/doc.txt', 'files/bucket/01folder/nested/inner.txt']);

    const result = await resolveExportEntries(['public/01folder/'], getNode, gatherDescendantUrls);

    expect(result).toEqual([
      { storagePath: 'bucket/01folder/doc.txt', exportFolderPath: 'public/01folder/' },
      { storagePath: 'bucket/01folder/nested/inner.txt', exportFolderPath: 'public/01folder/' },
    ]);
  });

  test('includes files nested more than one level deep', async () => {
    const getNode = vi.fn().mockResolvedValue(folderNode());
    const gatherDescendantUrls = vi.fn().mockResolvedValue(['files/bucket/folder/a/b/c/deep.txt']);

    const result = await resolveExportEntries(['bucket/folder/'], getNode, gatherDescendantUrls);

    expect(result).toEqual([{ storagePath: 'bucket/folder/a/b/c/deep.txt', exportFolderPath: 'bucket/folder/' }]);
  });

  test('excludes a technical marker whether selected directly or via folder expansion', async () => {
    const getNode = vi
      .fn()
      .mockImplementation((path: string) =>
        Promise.resolve(path === 'bucket/.dial_folder' ? itemNode('files/bucket/.dial_folder') : folderNode()),
      );
    const gatherDescendantUrls = vi
      .fn()
      .mockResolvedValue(['files/bucket/folder/.dial_folder', 'files/bucket/folder/a.txt']);

    const direct = await resolveExportEntries(['bucket/.dial_folder'], getNode, gatherDescendantUrls);
    const viaFolder = await resolveExportEntries(['bucket/folder/'], getNode, gatherDescendantUrls);

    expect(direct).toEqual([]);
    expect(viaFolder).toEqual([{ storagePath: 'bucket/folder/a.txt', exportFolderPath: 'bucket/folder/' }]);
  });

  test('rejects a duplicate storage path across entries', async () => {
    const getNode = vi.fn().mockResolvedValue(folderNode());
    const gatherDescendantUrls = vi.fn().mockResolvedValue(['files/bucket/folder/a.txt']);

    await expect(
      resolveExportEntries(['bucket/folder/a.txt', 'bucket/folder/'], getNode, gatherDescendantUrls),
    ).rejects.toThrow(/Duplicate entry/);
  });

  test('a non-folder selection never triggers a descendant walk', async () => {
    const getNode = vi.fn().mockResolvedValue(itemNode('files/bucket/doc.txt'));
    const gatherDescendantUrls = vi.fn();

    await resolveExportEntries(['bucket/doc.txt'], getNode, gatherDescendantUrls);

    expect(gatherDescendantUrls).not.toHaveBeenCalled();
  });
});

describe('Server :: Files :: export :: toExportArchivePath', () => {
  test('a single selected file flattens to public/<filename>', () => {
    expect(toExportArchivePath('bucket/folder/doc.txt', null)).toBe('public/doc.txt');
  });

  test('a folder selection is re-rooted under public/<lastSegment>/<relativePath>', () => {
    expect(toExportArchivePath('bucket/folder/sub/doc.txt', 'bucket/folder/')).toBe('public/folder/sub/doc.txt');
  });

  test('a direct child of the exported folder has no extra nesting', () => {
    expect(toExportArchivePath('bucket/folder/doc.txt', 'bucket/folder/')).toBe('public/folder/doc.txt');
  });

  test('a deeply nested descendant preserves its full relative path', () => {
    expect(toExportArchivePath('bucket/folder/a/b/c/deep.txt', 'bucket/folder/')).toBe('public/folder/a/b/c/deep.txt');
  });
});

describe('Server :: Files :: export :: buildFilesExportZip', () => {
  test('produces a zip with the correctly rewritten entries for a mixed file+folder selection', async () => {
    const filesCoreApi = {
      getFileMetadata: vi.fn().mockImplementation((_token: unknown, path: string, recursive: boolean) => {
        if (path !== 'bucket/folder/') {
          return Promise.resolve(itemNode(`files/${path}`));
        }
        return Promise.resolve(
          recursive
            ? folderNode([
                { url: 'files/bucket/folder/a.txt', nodeType: 'ITEM' },
                { url: 'files/bucket/folder/.dial_folder', nodeType: 'ITEM' },
                { url: 'files/bucket/folder/sub/b.txt', nodeType: 'ITEM' },
              ])
            : folderNode(),
        );
      }),
      downloadFile: vi.fn().mockImplementation(() => Promise.resolve(new Response('file-bytes'))),
    } as any;

    const result = await buildFilesExportZip(filesCoreApi, {} as any, ['bucket/single.txt', 'bucket/folder/']);

    expect(filesCoreApi.downloadFile).toHaveBeenCalledTimes(3);
    expect(result.fileName).toBe('files-export-2.zip');

    const zip = await JSZip.loadAsync(result.blob);
    const filePaths = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name)
      .sort();
    expect(filePaths).toEqual([
      'files/public/folder/a.txt',
      'files/public/folder/sub/b.txt',
      'files/public/single.txt',
    ]);
  });

  test('a single-item selection produces a name-derived filename', async () => {
    const filesCoreApi = {
      getFileMetadata: vi.fn().mockResolvedValue(itemNode('files/bucket/doc.txt')),
      downloadFile: vi.fn().mockResolvedValue(new Response('file-bytes')),
    } as any;

    const result = await buildFilesExportZip(filesCoreApi, {} as any, ['bucket/doc.txt']);

    expect(result.fileName).toBe('doc.txt.zip');
  });
});

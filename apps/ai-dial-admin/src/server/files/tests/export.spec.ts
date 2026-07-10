import JSZip from 'jszip';
import { describe, expect, test, vi } from 'vitest';

import { buildFilesExportZip, isTechnicalItem, resolveExportEntries, toExportArchivePath } from '../export';

describe('Server :: Files :: export :: isTechnicalItem', () => {
  test('matches the bare marker file', () => {
    expect(isTechnicalItem('bucket/folder/.dial_folder')).toBe(true);
  });

  test('matches a versioned marker file', () => {
    expect(isTechnicalItem('bucket/folder/.dial_folder__1.0.0')).toBe(true);
  });

  test('does not match a regular file', () => {
    expect(isTechnicalItem('bucket/folder/doc.txt')).toBe(false);
  });
});

describe('Server :: Files :: export :: resolveExportEntries', () => {
  test('includes a non-folder path directly with no export folder', async () => {
    const listFolderChildren = vi.fn();

    const result = await resolveExportEntries(['bucket/doc.txt'], listFolderChildren);

    expect(result).toEqual([{ storagePath: 'bucket/doc.txt', exportFolderPath: null }]);
    expect(listFolderChildren).not.toHaveBeenCalled();
  });

  test('expands a folder path into its children, tagged with the folder path', async () => {
    const listFolderChildren = vi.fn().mockResolvedValue(['bucket/folder/a.txt', 'bucket/folder/b.txt']);

    const result = await resolveExportEntries(['bucket/folder/'], listFolderChildren);

    expect(listFolderChildren).toHaveBeenCalledWith('bucket/folder/');
    expect(result).toEqual([
      { storagePath: 'bucket/folder/a.txt', exportFolderPath: 'bucket/folder/' },
      { storagePath: 'bucket/folder/b.txt', exportFolderPath: 'bucket/folder/' },
    ]);
  });

  test('excludes a technical marker whether selected directly or via folder expansion', async () => {
    const listFolderChildren = vi.fn().mockResolvedValue(['bucket/folder/.dial_folder', 'bucket/folder/a.txt']);

    const direct = await resolveExportEntries(['bucket/.dial_folder'], vi.fn());
    const viaFolder = await resolveExportEntries(['bucket/folder/'], listFolderChildren);

    expect(direct).toEqual([]);
    expect(viaFolder).toEqual([{ storagePath: 'bucket/folder/a.txt', exportFolderPath: 'bucket/folder/' }]);
  });

  test('rejects a duplicate storage path across entries', async () => {
    const listFolderChildren = vi.fn().mockResolvedValue(['bucket/folder/a.txt']);

    await expect(resolveExportEntries(['bucket/folder/a.txt', 'bucket/folder/'], listFolderChildren)).rejects.toThrow(
      /Duplicate entry/,
    );
  });

  test('a nested subfolder is not itself expanded (one level deep only, matching the backend)', async () => {
    // The caller's listFolderChildren callback is only ever asked about the top selected
    // folder path — resolveExportEntries never recurses into a FOLDER-typed child itself.
    const listFolderChildren = vi.fn().mockResolvedValue(['bucket/folder/a.txt']);

    await resolveExportEntries(['bucket/folder/'], listFolderChildren);

    expect(listFolderChildren).toHaveBeenCalledTimes(1);
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
});

describe('Server :: Files :: export :: buildFilesExportZip', () => {
  test('produces a zip with the correctly rewritten entries for a mixed file+folder selection', async () => {
    const filesCoreApi = {
      getFileMetadata: vi.fn().mockResolvedValue({
        items: [
          { path: 'bucket/folder/a.txt', nodeType: 'ITEM' },
          { path: 'bucket/folder/.dial_folder', nodeType: 'ITEM' },
          { path: 'bucket/folder/sub/', nodeType: 'FOLDER' },
        ],
      }),
      downloadFile: vi.fn().mockImplementation(() => Promise.resolve(new Response('file-bytes'))),
    } as any;

    const result = await buildFilesExportZip(filesCoreApi, {} as any, ['bucket/single.txt', 'bucket/folder/']);

    expect(filesCoreApi.downloadFile).toHaveBeenCalledTimes(2);
    expect(result.fileName).toBe('files-export-2.zip');

    const zip = await JSZip.loadAsync(result.blob);
    const filePaths = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name)
      .sort();
    expect(filePaths).toEqual(['files/public/folder/a.txt', 'files/public/single.txt']);
  });

  test('a single-item selection produces a name-derived filename', async () => {
    const filesCoreApi = {
      getFileMetadata: vi.fn(),
      downloadFile: vi.fn().mockResolvedValue(new Response('file-bytes')),
    } as any;

    const result = await buildFilesExportZip(filesCoreApi, {} as any, ['bucket/doc.txt']);

    expect(result.fileName).toBe('doc.txt.zip');
  });
});

import { describe, expect, test, vi } from 'vitest';

import { listSafeFileEntries, readEntryBounded, UnsafeZipError } from '../zip-safety';

vi.mock('../limits', () => ({
  getZipImportLimits: () => ({ maxEntries: 3, maxEntryBytes: 10, maxTotalBytes: 15 }),
}));

const fileEntry = (overrides: Record<string, unknown> = {}) => ({
  directory: false,
  symlink: false,
  filename: 'files/a.txt',
  uncompressedSize: 1,
  ...overrides,
});

const readerOf = (entries: unknown[]) => ({ getEntries: vi.fn().mockResolvedValue(entries) }) as any;

describe('Server :: Zip :: zip-safety :: listSafeFileEntries', () => {
  test('returns file entries and drops directories and symlinks', async () => {
    const file = fileEntry();
    const entries = await listSafeFileEntries(
      readerOf([file, fileEntry({ directory: true }), fileEntry({ symlink: true, filename: 'files/link' })]),
    );

    expect(entries).toEqual([file]);
  });

  test('rejects an archive with too many entries', async () => {
    const reader = readerOf([fileEntry(), fileEntry(), fileEntry(), fileEntry()]);

    await expect(listSafeFileEntries(reader)).rejects.toThrow(UnsafeZipError);
  });

  test('rejects an entry that declares more than the per-entry limit', async () => {
    await expect(listSafeFileEntries(readerOf([fileEntry({ uncompressedSize: 11 })]))).rejects.toThrow(UnsafeZipError);
  });

  test('rejects an archive whose declared total exceeds the total limit', async () => {
    const reader = readerOf([fileEntry({ uncompressedSize: 8 }), fileEntry({ uncompressedSize: 8 })]);

    await expect(listSafeFileEntries(reader)).rejects.toThrow(UnsafeZipError);
  });
});

describe('Server :: Zip :: zip-safety :: readEntryBounded', () => {
  const entryWriting = (chunks: number[][]) => ({
    getData: async ({ writable }: { writable: WritableStream }) => {
      const writer = writable.getWriter();
      for (const chunk of chunks) {
        await writer.write(new Uint8Array(chunk));
      }
      await writer.close();
    },
  });

  test('returns the inflated content as a typed Blob', async () => {
    const blob = await readEntryBounded(entryWriting([[1, 2], [3]]) as any, 'text/plain');

    expect(blob.size).toBe(3);
    expect(blob.type).toBe('text/plain');
  });

  test('aborts when the real inflated size exceeds the limit despite a small declared size', async () => {
    const entry = entryWriting([new Array(6).fill(1), new Array(6).fill(1)]);

    await expect(readEntryBounded(entry as any)).rejects.toThrow(UnsafeZipError);
  });
});

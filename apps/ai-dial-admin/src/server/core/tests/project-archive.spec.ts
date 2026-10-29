import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import { describe, expect, test } from 'vitest';

import { readArchiveFileSizes } from '../project-archive';

const buildArchive = async (files: Record<string, string>, directories: string[] = []): Promise<Blob> => {
  const writer = new ZipWriter(new BlobWriter('application/zip'));
  for (const directory of directories) {
    await writer.add(directory, undefined, { directory: true });
  }
  for (const [name, content] of Object.entries(files)) {
    await writer.add(name, new TextReader(content));
  }
  return writer.close();
};

describe('Server :: Core :: readArchiveFileSizes', () => {
  test('returns the uncompressed size of every file keyed by its path', async () => {
    const archive = await buildArchive({
      'PROJECT.md': '---\nname: p\n---\n',
      'context/a.csv': 'a,b\n1,2\n',
      'context/nested/b.pdf': 'x'.repeat(500),
    });

    const sizes = await readArchiveFileSizes(archive);

    expect(Object.fromEntries(sizes)).toEqual({
      'PROJECT.md': 16,
      'context/a.csv': 8,
      'context/nested/b.pdf': 500,
    });
  });

  test('reports the inflated size of a compressible file, not its compressed size', async () => {
    const archive = await buildArchive({ 'context/big.csv': 'a'.repeat(100_000) });

    expect((await readArchiveFileSizes(archive)).get('context/big.csv')).toBe(100_000);
  });

  test('leaves directory entries out', async () => {
    const archive = await buildArchive({ 'context/a.csv': 'x' }, ['context/']);

    expect([...(await readArchiveFileSizes(archive)).keys()]).toEqual(['context/a.csv']);
  });

  test('returns an empty map for an archive with no files', async () => {
    expect((await readArchiveFileSizes(await buildArchive({}))).size).toBe(0);
  });

  test('rejects a body that is not a zip archive', async () => {
    await expect(readArchiveFileSizes(new Blob(['{"not":"a zip"}']))).rejects.toThrow();
  });
});

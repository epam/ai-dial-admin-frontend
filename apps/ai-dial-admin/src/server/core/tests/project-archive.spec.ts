import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import { describe, expect, test } from 'vitest';

import { readArchiveFileSizes, readBodyWithin } from '../project-archive';

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

/** A response whose body streams the given chunks and declares no `content-length`, like a chunked one. */
const chunkedResponse = (chunks: string[], headers?: HeadersInit) =>
  new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    { headers },
  );

describe('Server :: Core :: readBodyWithin', () => {
  test('returns the whole body when it is within the cap', async () => {
    const body = await readBodyWithin(chunkedResponse(['abc', 'def']), 10);

    expect(await body?.text()).toBe('abcdef');
  });

  test('accepts a body exactly at the cap', async () => {
    expect(await readBodyWithin(chunkedResponse(['abcde', 'fghij']), 10)).toBeDefined();
  });

  test('gives up on a body with no declared length once it passes the cap', async () => {
    const response = chunkedResponse(['abcdef', 'ghijkl', 'mnop']);

    expect(response.headers.get('content-length')).toBeNull();
    expect(await readBodyWithin(response, 10)).toBeUndefined();
  });

  test('stops reading as soon as the cap is passed instead of buffering the rest', async () => {
    const pulled: string[] = [];
    const response = new Response(
      new ReadableStream({
        pull(controller) {
          pulled.push('chunk');
          controller.enqueue(new Uint8Array(6));
        },
      }),
    );

    expect(await readBodyWithin(response, 10)).toBeUndefined();
    // Two 6-byte chunks pass a 10-byte cap; the stream is never drained to its end (it has none).
    expect(pulled.length).toBeLessThan(5);
  });

  test('refuses a declared length over the cap without reading the body', async () => {
    const response = chunkedResponse(['abc'], { 'content-length': '999' });

    expect(await readBodyWithin(response, 10)).toBeUndefined();
  });

  test('returns an empty blob for a response with no body', async () => {
    const body = await readBodyWithin(new Response(null), 10);

    expect(body?.size).toBe(0);
  });
});

import { describe, expect, test } from 'vitest';
import { ZipFixture, readZipEntries } from '@/src/server/zip/tests/zip-fixtures';

import {
  InvalidToolsetsZipError,
  TOOLSETS_ZIP_ENTRY,
  buildToolsetsZip,
  extractToolsetsFromZip,
  mergeToolsetsExports,
} from '../zip-exim';

describe('Server :: Toolsets :: zip-exim :: buildToolsetsZip', () => {
  test('wraps the document as a single toolSets/toolSets.json entry', async () => {
    const document = { toolSets: [{ id: 'toolsets/public/name__1.0', name: 'name' } as any] };

    const blob = await buildToolsetsZip(document);
    const entries = await readZipEntries(blob);

    expect(Object.keys(entries)).toHaveLength(1);
    expect(Object.keys(entries)[0]).toBe(TOOLSETS_ZIP_ENTRY);
    expect(JSON.parse(entries[TOOLSETS_ZIP_ENTRY])).toEqual(document);
  });
});

describe('Server :: Toolsets :: zip-exim :: mergeToolsetsExports', () => {
  test('merges disjoint documents into one', () => {
    const a = { toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a' } as any] };
    const b = { toolSets: [{ id: 'toolsets/public/b__1.0', name: 'b' } as any] };

    expect(mergeToolsetsExports([a, b])).toEqual({ toolSets: [...a.toolSets, ...b.toolSets] });
  });

  test('throws on a toolset id repeated across documents', () => {
    const a = { toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a' } as any] };
    const b = { toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a-dup' } as any] };

    expect(() => mergeToolsetsExports([a, b])).toThrow(InvalidToolsetsZipError);
  });
});

describe('Server :: Toolsets :: zip-exim :: extractToolsetsFromZip', () => {
  test('extracts and merges every toolSets/*.json entry', async () => {
    const zip = new ZipFixture();
    zip.file('toolSets/a.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a' }] }));
    zip.file('toolSets/b.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.toArrayBuffer();

    const result = await extractToolsetsFromZip(buffer);

    expect((result.toolSets ?? []).map((t) => t.id).sort()).toEqual([
      'toolsets/public/a__1.0',
      'toolsets/public/b__1.0',
    ]);
  });

  test('ignores an entry outside the toolSets/ prefix', async () => {
    const zip = new ZipFixture();
    zip.file('toolSets/a.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a' }] }));
    zip.file('other/b.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.toArrayBuffer();

    const result = await extractToolsetsFromZip(buffer);

    expect((result.toolSets ?? []).map((t) => t.id)).toEqual(['toolsets/public/a__1.0']);
  });

  test('rejects an archive with no valid toolSets entries', async () => {
    const zip = new ZipFixture();
    zip.file('other/b.json', JSON.stringify({ toolSets: [] }));
    const buffer = await zip.toArrayBuffer();

    await expect(extractToolsetsFromZip(buffer)).rejects.toThrow(InvalidToolsetsZipError);
  });
});

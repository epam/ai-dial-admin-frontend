import { describe, expect, test } from 'vitest';
import { ZipFixture, readZipEntries } from '@/src/server/zip/tests/zip-fixtures';

import {
  InvalidAssetZipError,
  ZipEximConfig,
  buildAssetZip,
  extractAssetsFromZip,
  mergeAssetExports,
} from '../zip-exim';

interface Widget {
  id?: string;
  name: string;
}

const CONFIG: ZipEximConfig<Widget> = {
  entryPrefix: 'widgets/',
  entryFileName: 'widgets/widgets.json',
  getEntities: (doc) => (doc as any).widgets,
  setEntities: (widgets) => ({ widgets }) as any,
};

describe('Server :: Assets :: zip-exim :: buildAssetZip', () => {
  test('wraps the document as a single configured entry', async () => {
    const document = { widgets: [{ id: 'widgets/public/name', name: 'name' }] } as any;

    const blob = await buildAssetZip(CONFIG, document);
    const entries = await readZipEntries(blob);

    expect(Object.keys(entries)).toHaveLength(1);
    expect(Object.keys(entries)[0]).toBe('widgets/widgets.json');
    expect(JSON.parse(entries['widgets/widgets.json'])).toEqual(document);
  });
});

describe('Server :: Assets :: zip-exim :: mergeAssetExports', () => {
  test('merges disjoint documents into one', () => {
    const a = { widgets: [{ id: 'widgets/a', name: 'a' }] } as any;
    const b = { widgets: [{ id: 'widgets/b', name: 'b' }] } as any;

    expect(mergeAssetExports(CONFIG, [a, b])).toEqual({ widgets: [...a.widgets, ...b.widgets] });
  });

  test('throws on an id repeated across documents', () => {
    const a = { widgets: [{ id: 'widgets/a', name: 'a' }] } as any;
    const b = { widgets: [{ id: 'widgets/a', name: 'a-dup' }] } as any;

    expect(() => mergeAssetExports(CONFIG, [a, b])).toThrow(InvalidAssetZipError);
  });
});

describe('Server :: Assets :: zip-exim :: extractAssetsFromZip', () => {
  test('extracts and merges every matching-prefix json entry', async () => {
    const zip = new ZipFixture();
    zip.file('widgets/a.json', JSON.stringify({ widgets: [{ id: 'widgets/a', name: 'a' }] }));
    zip.file('widgets/b.json', JSON.stringify({ widgets: [{ id: 'widgets/b', name: 'b' }] }));
    const buffer = await zip.toArrayBuffer();

    const result = (await extractAssetsFromZip(CONFIG, buffer)) as any;

    expect(result.widgets.map((w: Widget) => w.id).sort()).toEqual(['widgets/a', 'widgets/b']);
  });

  test('ignores an entry outside the configured prefix', async () => {
    const zip = new ZipFixture();
    zip.file('widgets/a.json', JSON.stringify({ widgets: [{ id: 'widgets/a', name: 'a' }] }));
    zip.file('other/b.json', JSON.stringify({ widgets: [{ id: 'widgets/b', name: 'b' }] }));
    const buffer = await zip.toArrayBuffer();

    const result = (await extractAssetsFromZip(CONFIG, buffer)) as any;

    expect(result.widgets.map((w: Widget) => w.id)).toEqual(['widgets/a']);
  });

  test('rejects an archive with no valid entries', async () => {
    const zip = new ZipFixture();
    zip.file('other/b.json', JSON.stringify({ widgets: [] }));
    const buffer = await zip.toArrayBuffer();

    await expect(extractAssetsFromZip(CONFIG, buffer)).rejects.toThrow(InvalidAssetZipError);
  });
});

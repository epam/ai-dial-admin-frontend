import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';

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
    const zip = await JSZip.loadAsync(blob);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('widgets/widgets.json');
    const content = await zip.file('widgets/widgets.json')?.async('string');
    expect(JSON.parse(content as string)).toEqual(document);
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
    const zip = new JSZip();
    zip.file('widgets/a.json', JSON.stringify({ widgets: [{ id: 'widgets/a', name: 'a' }] }));
    zip.file('widgets/b.json', JSON.stringify({ widgets: [{ id: 'widgets/b', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = (await extractAssetsFromZip(CONFIG, buffer)) as any;

    expect(result.widgets.map((w: Widget) => w.id).sort()).toEqual(['widgets/a', 'widgets/b']);
  });

  test('ignores an entry outside the configured prefix', async () => {
    const zip = new JSZip();
    zip.file('widgets/a.json', JSON.stringify({ widgets: [{ id: 'widgets/a', name: 'a' }] }));
    zip.file('other/b.json', JSON.stringify({ widgets: [{ id: 'widgets/b', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = (await extractAssetsFromZip(CONFIG, buffer)) as any;

    expect(result.widgets.map((w: Widget) => w.id)).toEqual(['widgets/a']);
  });

  test('rejects an archive with no valid entries', async () => {
    const zip = new JSZip();
    zip.file('other/b.json', JSON.stringify({ widgets: [] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    await expect(extractAssetsFromZip(CONFIG, buffer)).rejects.toThrow(InvalidAssetZipError);
  });
});

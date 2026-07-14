import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';

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
    const zip = await JSZip.loadAsync(blob);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe(TOOLSETS_ZIP_ENTRY);
    const content = await zip.file(TOOLSETS_ZIP_ENTRY)?.async('string');
    expect(JSON.parse(content as string)).toEqual(document);
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
    const zip = new JSZip();
    zip.file('toolSets/a.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a' }] }));
    zip.file('toolSets/b.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await extractToolsetsFromZip(buffer);

    expect(result.toolSets.map((t) => t.id).sort()).toEqual(['toolsets/public/a__1.0', 'toolsets/public/b__1.0']);
  });

  test('ignores an entry outside the toolSets/ prefix', async () => {
    const zip = new JSZip();
    zip.file('toolSets/a.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/a__1.0', name: 'a' }] }));
    zip.file('other/b.json', JSON.stringify({ toolSets: [{ id: 'toolsets/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await extractToolsetsFromZip(buffer);

    expect(result.toolSets.map((t) => t.id)).toEqual(['toolsets/public/a__1.0']);
  });

  test('rejects an archive with no valid toolSets entries', async () => {
    const zip = new JSZip();
    zip.file('other/b.json', JSON.stringify({ toolSets: [] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    await expect(extractToolsetsFromZip(buffer)).rejects.toThrow(InvalidToolsetsZipError);
  });
});

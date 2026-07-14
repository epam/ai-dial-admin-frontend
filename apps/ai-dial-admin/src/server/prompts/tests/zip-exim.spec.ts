import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';

import {
  InvalidPromptsZipError,
  PROMPTS_ZIP_ENTRY,
  buildPromptsZip,
  extractPromptsFromZip,
  mergePromptsExports,
} from '../zip-exim';

describe('Server :: Prompts :: zip-exim :: buildPromptsZip', () => {
  test('wraps the document as a single prompts/prompts.json entry', async () => {
    const document = { prompts: [{ id: 'prompts/public/name__1.0', name: 'name' } as any] };

    const blob = await buildPromptsZip(document);
    const zip = await JSZip.loadAsync(blob);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe(PROMPTS_ZIP_ENTRY);
    const content = await zip.file(PROMPTS_ZIP_ENTRY)?.async('string');
    expect(JSON.parse(content as string)).toEqual(document);
  });
});

describe('Server :: Prompts :: zip-exim :: mergePromptsExports', () => {
  test('merges disjoint documents into one', () => {
    const a = { prompts: [{ id: 'prompts/public/a__1.0', name: 'a' } as any] };
    const b = { prompts: [{ id: 'prompts/public/b__1.0', name: 'b' } as any] };

    expect(mergePromptsExports([a, b])).toEqual({ prompts: [...a.prompts, ...b.prompts] });
  });

  test('throws on a prompt id repeated across documents', () => {
    const a = { prompts: [{ id: 'prompts/public/a__1.0', name: 'a' } as any] };
    const b = { prompts: [{ id: 'prompts/public/a__1.0', name: 'a-dup' } as any] };

    expect(() => mergePromptsExports([a, b])).toThrow(InvalidPromptsZipError);
  });
});

describe('Server :: Prompts :: zip-exim :: extractPromptsFromZip', () => {
  test('extracts and merges every prompts/*.json entry', async () => {
    const zip = new JSZip();
    zip.file('prompts/a.json', JSON.stringify({ prompts: [{ id: 'prompts/public/a__1.0', name: 'a' }] }));
    zip.file('prompts/b.json', JSON.stringify({ prompts: [{ id: 'prompts/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await extractPromptsFromZip(buffer);

    expect(result.prompts.map((p) => p.id).sort()).toEqual(['prompts/public/a__1.0', 'prompts/public/b__1.0']);
  });

  test('ignores an entry outside the prompts/ prefix', async () => {
    const zip = new JSZip();
    zip.file('prompts/a.json', JSON.stringify({ prompts: [{ id: 'prompts/public/a__1.0', name: 'a' }] }));
    zip.file('other/b.json', JSON.stringify({ prompts: [{ id: 'prompts/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await extractPromptsFromZip(buffer);

    expect(result.prompts.map((p) => p.id)).toEqual(['prompts/public/a__1.0']);
  });

  test('rejects an archive with no valid prompts entries', async () => {
    const zip = new JSZip();
    zip.file('other/b.json', JSON.stringify({ prompts: [] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    await expect(extractPromptsFromZip(buffer)).rejects.toThrow(InvalidPromptsZipError);
  });
});

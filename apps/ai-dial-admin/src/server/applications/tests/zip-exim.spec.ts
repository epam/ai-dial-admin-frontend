import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';

import {
  APPLICATIONS_ZIP_ENTRY,
  InvalidApplicationsZipError,
  buildApplicationsZip,
  extractApplicationsFromZip,
  mergeApplicationsExports,
} from '../zip-exim';

describe('Server :: Applications :: zip-exim :: buildApplicationsZip', () => {
  test('wraps the document as a single applications/applications.json entry', async () => {
    const document = { applications: [{ id: 'applications/public/name__1.0', name: 'name' } as any] };

    const blob = await buildApplicationsZip(document);
    const zip = await JSZip.loadAsync(blob);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe(APPLICATIONS_ZIP_ENTRY);
    const content = await zip.file(APPLICATIONS_ZIP_ENTRY)?.async('string');
    expect(JSON.parse(content as string)).toEqual(document);
  });
});

describe('Server :: Applications :: zip-exim :: mergeApplicationsExports', () => {
  test('merges disjoint documents into one', () => {
    const a = { applications: [{ id: 'applications/public/a__1.0', name: 'a' } as any] };
    const b = { applications: [{ id: 'applications/public/b__1.0', name: 'b' } as any] };

    expect(mergeApplicationsExports([a, b])).toEqual({ applications: [...a.applications, ...b.applications] });
  });

  test('throws on an application id repeated across documents', () => {
    const a = { applications: [{ id: 'applications/public/a__1.0', name: 'a' } as any] };
    const b = { applications: [{ id: 'applications/public/a__1.0', name: 'a-dup' } as any] };

    expect(() => mergeApplicationsExports([a, b])).toThrow(InvalidApplicationsZipError);
  });
});

describe('Server :: Applications :: zip-exim :: extractApplicationsFromZip', () => {
  test('extracts and merges every applications/*.json entry', async () => {
    const zip = new JSZip();
    zip.file('applications/a.json', JSON.stringify({ applications: [{ id: 'applications/public/a__1.0', name: 'a' }] }));
    zip.file('applications/b.json', JSON.stringify({ applications: [{ id: 'applications/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await extractApplicationsFromZip(buffer);

    expect(result.applications.map((a) => a.id).sort()).toEqual([
      'applications/public/a__1.0',
      'applications/public/b__1.0',
    ]);
  });

  test('ignores an entry outside the applications/ prefix', async () => {
    const zip = new JSZip();
    zip.file('applications/a.json', JSON.stringify({ applications: [{ id: 'applications/public/a__1.0', name: 'a' }] }));
    zip.file('other/b.json', JSON.stringify({ applications: [{ id: 'applications/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const result = await extractApplicationsFromZip(buffer);

    expect(result.applications.map((a) => a.id)).toEqual(['applications/public/a__1.0']);
  });

  test('rejects an archive with no valid applications entries', async () => {
    const zip = new JSZip();
    zip.file('other/b.json', JSON.stringify({ applications: [] }));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    await expect(extractApplicationsFromZip(buffer)).rejects.toThrow(InvalidApplicationsZipError);
  });
});

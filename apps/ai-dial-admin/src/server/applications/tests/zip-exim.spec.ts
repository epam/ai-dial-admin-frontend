import { describe, expect, test } from 'vitest';
import { ZipFixture, readZipEntries } from '@/src/server/zip/tests/zip-fixtures';

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
    const entries = await readZipEntries(blob);

    expect(Object.keys(entries)).toHaveLength(1);
    expect(Object.keys(entries)[0]).toBe(APPLICATIONS_ZIP_ENTRY);
    expect(JSON.parse(entries[APPLICATIONS_ZIP_ENTRY])).toEqual(document);
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
    const zip = new ZipFixture();
    zip.file(
      'applications/a.json',
      JSON.stringify({ applications: [{ id: 'applications/public/a__1.0', name: 'a' }] }),
    );
    zip.file(
      'applications/b.json',
      JSON.stringify({ applications: [{ id: 'applications/public/b__1.0', name: 'b' }] }),
    );
    const buffer = await zip.toArrayBuffer();

    const result = await extractApplicationsFromZip(buffer);

    expect((result.applications ?? []).map((a) => a.id).sort()).toEqual([
      'applications/public/a__1.0',
      'applications/public/b__1.0',
    ]);
  });

  test('ignores an entry outside the applications/ prefix', async () => {
    const zip = new ZipFixture();
    zip.file(
      'applications/a.json',
      JSON.stringify({ applications: [{ id: 'applications/public/a__1.0', name: 'a' }] }),
    );
    zip.file('other/b.json', JSON.stringify({ applications: [{ id: 'applications/public/b__1.0', name: 'b' }] }));
    const buffer = await zip.toArrayBuffer();

    const result = await extractApplicationsFromZip(buffer);

    expect((result.applications ?? []).map((a) => a.id)).toEqual(['applications/public/a__1.0']);
  });

  test('rejects an archive with no valid applications entries', async () => {
    const zip = new ZipFixture();
    zip.file('other/b.json', JSON.stringify({ applications: [] }));
    const buffer = await zip.toArrayBuffer();

    await expect(extractApplicationsFromZip(buffer)).rejects.toThrow(InvalidApplicationsZipError);
  });
});

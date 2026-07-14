import JSZip from 'jszip';
import { describe, expect, test, vi } from 'vitest';

import { ServerActionResponse } from '@/src/models/server-action';
import { importPlainFiles, importZipFile, InvalidImportZipError } from '../import';

const file = (name: string, content = 'data') => new File([content], name, { type: 'text/plain' });

describe('Server :: Files :: import :: importPlainFiles', () => {
  test('uploads every file and reports success', async () => {
    const upload = vi.fn().mockResolvedValue({ success: true } as ServerActionResponse);

    const result = await importPlainFiles([file('a.txt'), file('b.txt')], 'folder/', upload, 5);

    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenNthCalledWith(1, 'folder/a.txt', expect.any(File));
    expect(result.importResults).toEqual([
      { targetPath: 'folder/a.txt', status: 'success' },
      { targetPath: 'folder/b.txt', status: 'success' },
    ]);
  });

  test('classifies a 412 precondition-failed response as skipped, not failure', async () => {
    const upload = vi.fn().mockResolvedValue({ success: false, status: 412 } as ServerActionResponse);

    const result = await importPlainFiles([file('a.txt')], 'folder/', upload, 5);

    expect(result.importResults).toEqual([{ targetPath: 'folder/a.txt', status: 'skipped' }]);
  });

  test('aborts the batch after N consecutive failures', async () => {
    const upload = vi
      .fn()
      .mockResolvedValue({ success: false, status: 500, errorMessage: 'boom' } as ServerActionResponse);

    const result = await importPlainFiles(
      [file('a.txt'), file('b.txt'), file('c.txt'), file('d.txt')],
      'folder/',
      upload,
      2,
    );

    expect(upload).toHaveBeenCalledTimes(2);
    expect(result.importResults).toHaveLength(2);
    expect(result.importResults.every((r) => r.status === 'failure')).toBe(true);
  });

  test('a success mid-batch resets the consecutive-failure counter', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ success: false, status: 500, errorMessage: 'boom' } as ServerActionResponse)
      .mockResolvedValueOnce({ success: true } as ServerActionResponse)
      .mockResolvedValueOnce({ success: false, status: 500, errorMessage: 'boom' } as ServerActionResponse)
      .mockResolvedValueOnce({ success: false, status: 500, errorMessage: 'boom' } as ServerActionResponse);

    const result = await importPlainFiles(
      [file('a.txt'), file('b.txt'), file('c.txt'), file('d.txt')],
      'folder/',
      upload,
      2,
    );

    expect(upload).toHaveBeenCalledTimes(4);
    expect(result.importResults.map((r) => r.status)).toEqual(['failure', 'success', 'failure', 'failure']);
  });
});

describe('Server :: Files :: import :: importZipFile', () => {
  const buildZip = async (entries: Record<string, string>) => {
    const zip = new JSZip();
    Object.entries(entries).forEach(([path, content]) => zip.file(path, content));
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    return new File([buffer], 'archive.zip', { type: 'application/zip' });
  };

  test('uploads only entries under files/, inferring content type from filename', async () => {
    const upload = vi.fn().mockResolvedValue({ success: true } as ServerActionResponse);
    const zipFile = await buildZip({
      'files/doc.txt': 'hello',
      'files/sub/report.pdf': 'pdf-bytes',
      'not-files/outside.txt': 'should be ignored',
    });

    const result = await importZipFile(zipFile, 'folder/', upload, 5);

    expect(upload).toHaveBeenCalledTimes(2);
    const uploadedPaths = upload.mock.calls.map((call) => call[0]);
    expect(uploadedPaths).toEqual(expect.arrayContaining(['folder/doc.txt', 'folder/sub/report.pdf']));
    const uploadedFiles = upload.mock.calls.map((call) => call[1] as File);
    expect(uploadedFiles.find((f) => f.name === 'report.pdf')?.type).toBe('application/pdf');
    expect(result.importResults).toHaveLength(2);
  });

  test('rejects an archive with no valid entries', async () => {
    const upload = vi.fn();
    const zipFile = await buildZip({ 'not-files/outside.txt': 'x' });

    await expect(importZipFile(zipFile, 'folder/', upload, 5)).rejects.toThrow(InvalidImportZipError);
    expect(upload).not.toHaveBeenCalled();
  });

  test('a path-traversal entry inside the zip is silently excluded, not uploaded', async () => {
    const upload = vi.fn().mockResolvedValue({ success: true } as ServerActionResponse);
    const zipFile = await buildZip({
      'files/good.txt': 'ok',
      'files/../../escape.txt': 'malicious',
    });

    await importZipFile(zipFile, 'folder/', upload, 5);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledWith('folder/good.txt', expect.any(File));
  });
});

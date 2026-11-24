import { describe, expect, test } from 'vitest';

import { ImportRequestTooLargeError, readImportFormData } from '@/src/server/assets/read-import-form-data';

describe('readImportFormData', () => {
  test('parses a valid multipart request', async () => {
    const request = new Request('http://localhost/import', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=boundary' },
      body: '--boundary\r\nContent-Disposition: form-data; name="config"\r\n\r\n{}\r\n--boundary\r\nContent-Disposition: form-data; name="file"\r\n\r\n{}\r\n--boundary--\r\n',
    });

    const parsed = await readImportFormData(request);

    expect(parsed.get('file')).toBe('{}');
    expect(parsed.get('config')).toBe('{}');
  });

  test('rejects an oversized content length before parsing', async () => {
    const request = new Request('http://localhost/import', {
      method: 'POST',
      headers: { 'content-length': String(66 * 1024 * 1024 + 1) },
    });

    await expect(readImportFormData(request)).rejects.toBeInstanceOf(ImportRequestTooLargeError);
  });

  test('rejects an oversized streamed request even with a false content length', async () => {
    const header = new TextEncoder().encode(
      '--boundary\r\nContent-Disposition: form-data; name="file"; filename="x"\r\n\r\n',
    );
    const chunk = new Uint8Array(1024 * 1024);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(header);
        for (let index = 0; index < 66; index += 1) controller.enqueue(chunk);
        controller.close();
      },
    });
    const request = {
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=boundary', 'content-length': '1' }),
      body: stream,
    } as Request;

    await expect(readImportFormData(request)).rejects.toBeInstanceOf(ImportRequestTooLargeError);
  });
});

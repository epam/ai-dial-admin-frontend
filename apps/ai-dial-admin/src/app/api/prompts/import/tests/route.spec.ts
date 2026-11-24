import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';

import { POST } from '@/src/app/api/prompts/import/route';

describe('prompts import route', () => {
  test('rejects an oversized request before import', async () => {
    const request = new NextRequest('http://localhost/api/prompts/import?fileType=archive', {
      method: 'POST',
      headers: { 'content-length': String(66 * 1024 * 1024 + 1) },
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      success: false,
      errorHeader: 'Bad Request',
      errorMessage: 'Import request exceeds 66 MB',
    });
  });

  test('rejects malformed multipart data', async () => {
    const request = new NextRequest('http://localhost/api/prompts/import?fileType=json', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not a multipart request',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      errorHeader: 'Bad Request',
      errorMessage: 'Invalid import form data',
    });
  });
});

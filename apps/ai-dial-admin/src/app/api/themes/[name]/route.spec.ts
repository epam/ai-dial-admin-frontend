import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { themesApi } from '@/src/app/api/api';

import { GET } from './route';

vi.mock('@/src/app/api/api');

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" />';
const CACHE_CONTROL = 'public, max-age=1800, stale-while-revalidate=86400';

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/themes/logo.svg', { headers });
}

const params = { params: Promise.resolve({ name: 'logo.svg' }) };

function mockIcon(headers: Record<string, string> = {}) {
  vi.mocked(themesApi.getThemeIconUrl).mockResolvedValue(
    new Response(SVG, { headers: { 'content-type': 'image/svg+xml', ...headers } }),
  );
}

describe('GET /api/themes/[name]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 404 when the icon is not found', async () => {
    vi.mocked(themesApi.getThemeIconUrl).mockResolvedValue(undefined);

    const res = await GET(makeRequest(), params);

    expect(res.status).toBe(404);
    expect(await res.text()).toBe('Icon not found');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  test('returns 200 with the image, the cache policy and a content hash ETag', async () => {
    mockIcon();

    const res = await GET(makeRequest(), params);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(SVG);
    expect(res.headers.get('content-type')).toBe('image/svg+xml');
    expect(res.headers.get('cache-control')).toBe(CACHE_CONTROL);
    expect(res.headers.get('etag')).toMatch(/^"[\w-]+"$/);
  });

  test('returns the same ETag for the same content', async () => {
    mockIcon();
    const first = await GET(makeRequest(), params);
    mockIcon();
    const second = await GET(makeRequest(), params);

    expect(second.headers.get('etag')).toBe(first.headers.get('etag'));
  });

  test('forwards the upstream ETag when there is one', async () => {
    mockIcon({ etag: '"upstream-v1"' });

    const res = await GET(makeRequest(), params);

    expect(res.headers.get('etag')).toBe('"upstream-v1"');
  });

  test('returns 304 without a body when If-None-Match matches', async () => {
    mockIcon({ etag: '"upstream-v1"' });

    const res = await GET(makeRequest({ 'if-none-match': 'W/"other", W/"upstream-v1"' }), params);

    expect(res.status).toBe(304);
    expect(await res.text()).toBe('');
    expect(res.headers.get('etag')).toBe('"upstream-v1"');
    expect(res.headers.get('cache-control')).toBe(CACHE_CONTROL);
  });

  test('returns 200 when If-None-Match does not match', async () => {
    mockIcon({ etag: '"upstream-v2"' });

    const res = await GET(makeRequest({ 'if-none-match': '"upstream-v1"' }), params);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(SVG);
  });
});

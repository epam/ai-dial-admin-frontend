import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { GET } from '@/src/app/api/auth/me/picture/route';
import { getFullToken } from '@/src/utils/auth/token';

vi.mock('@/src/utils/auth/token', () => ({ getFullToken: vi.fn() }));
vi.mock('@/src/utils/auth/nextauth-client', () => ({ NextClient: { getOrCreateClient: vi.fn() } }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

const fetch = createFetchMock(vi);
fetch.enableMocks();

const IMAGE_BASE64 = 'AQID';
const req = {} as NextRequest;

const mockAzureToken = () =>
  vi.mocked(getFullToken).mockResolvedValue({
    access_token: 'token',
    providerId: 'azure-ad',
    hasInlinePicture: true,
  } as unknown as Awaited<ReturnType<typeof getFullToken>>);

const mockGraphPhoto = (contentType: string) =>
  fetch.mockResponseOnce(Buffer.from(IMAGE_BASE64, 'base64').toString('binary'), {
    headers: { 'Content-Type': contentType },
  });

describe('GET /api/auth/me/picture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.resetMocks();
    mockAzureToken();
  });

  test('serves the Graph photo when the Content-Type is a bare MIME type', async () => {
    mockGraphPhoto('image/jpeg');

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  test('serves the Graph photo when the Content-Type carries parameters', async () => {
    mockGraphPhoto('image/jpeg; charset=utf-8');

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  test('returns 404 when the Graph Content-Type is not a raster image', async () => {
    mockGraphPhoto('image/svg+xml');

    const response = await GET(req);

    expect(response.status).toBe(404);
  });
});

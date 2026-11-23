import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { BucketApi } from '../bucket-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: BucketApi', () => {
  const instance = new BucketApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getBucket calls GET /v1/bucket with the caller token and returns the parsed bucket', async () => {
    fetch.mockResponseOnce(JSON.stringify({ bucket: 'user-bucket', appdata: 'appdata/x' }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getBucket(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://core.test/v1/bucket', method: 'GET' }),
      expect.anything(),
    );
    const [, init] = fetch.mock.calls[0] as [Request, RequestInit];
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer access_token_mock');
    expect(result).toEqual({ bucket: 'user-bucket', appdata: 'appdata/x' });
  });

  test('getBucket returns null on failure', async () => {
    fetch.mockResponseOnce('boom', { status: 500 });

    const result = await instance.getBucket(TOKEN_MOCK);

    expect(result).toBeNull();
  });

  test('getBucket returns undefined when Core forbids the read', async () => {
    fetch.mockResponseOnce('Forbidden', { status: 403 });

    const result = await instance.getBucket(TOKEN_MOCK);

    expect(result).toBeUndefined();
  });
});

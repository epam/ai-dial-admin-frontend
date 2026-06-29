import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { BucketApi } from '../bucket-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: BucketApi', () => {
  const instance = new BucketApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getBucket calls GET /v1/bucket and returns the parsed bucket', async () => {
    fetch.mockResponseOnce(JSON.stringify({ bucket: 'user-bucket', appdata: 'appdata/x' }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getBucket(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/bucket'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual({ bucket: 'user-bucket', appdata: 'appdata/x' });
  });

  test('getBucket returns null on failure', async () => {
    fetch.mockResponseOnce('boom', { status: 500 });

    const result = await instance.getBucket(TOKEN_MOCK);

    expect(result).toBeNull();
  });
});

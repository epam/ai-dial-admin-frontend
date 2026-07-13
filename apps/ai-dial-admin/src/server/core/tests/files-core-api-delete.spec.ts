import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_MATCH } from '@/src/constants/api-headers';
import { FilesCoreApi } from '../files-core-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: FilesCoreApi :: deleteFile', () => {
  const instance = new FilesCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('deleteFile rejects before calling Core when the etag is missing', async () => {
    await expect(instance.deleteFile(TOKEN_MOCK, 'bucket/f/doc.txt', '')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('deleteFile sends If-Match when a concrete etag is supplied', async () => {
    fetch.mockResponseOnce('');

    await instance.deleteFile(TOKEN_MOCK, 'bucket/f/doc.txt', 'etag-1');

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/files/bucket/f/doc.txt');
    expect((init as RequestInit).method).toBe('DELETE');
    expect((init as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'etag-1' });
  });
});

import { describe, test, expect, vi } from 'vitest';
import { TopicApi, BASE_TOPICS_URL } from '../topics';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('TopicApi', () => {
  const instance = new TopicApi({ host: TEST_URL });

  test('getTopics calls base url', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getTopics(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(BASE_TOPICS_URL),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

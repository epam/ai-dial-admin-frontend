import { describe, test, expect, vi } from 'vitest';

import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { WhitelistApi, IMAGES_WHITELIST } from '@/src/server/deployments/whitelist';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('WhitelistApi', () => {
  const instance = new WhitelistApi({ host: TEST_URL });

  test('getGlobalWhitelist calls whitelist url', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getGlobalWhitelist(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGES_WHITELIST),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('updateGlobalWhitelist calls whitelist url', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.updateGlobalWhitelist([], TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(IMAGES_WHITELIST),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

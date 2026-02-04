import { describe, test, expect, vi } from 'vitest';

import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  HUGGINGFACE_MODELS_BASE,
  HUGGINGFACE_MODELS_SEARCH,
  HuggingfaceApi,
} from '@/src/server/deployments/huggingface';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('HuggingfaceApi', () => {
  const instance = new HuggingfaceApi({ host: TEST_URL });

  test('getGlobalWhitelist calls whitelist url', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getHuggingFaceModels('', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(HUGGINGFACE_MODELS_BASE),
      expect.objectContaining({ method: 'GET' }),
    );
  });
  test('getGlobalWhitelist calls whitelist url with query', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getHuggingFaceModels('test', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(HUGGINGFACE_MODELS_SEARCH('test')),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

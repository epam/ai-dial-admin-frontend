import { describe, test, expect, vi } from 'vitest';

import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { HUGGINGFACE_MODELS, HUGGINGFACE_MODEL_DETAILS, HuggingfaceApi } from '@/src/server/deployments/huggingface';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('HuggingfaceApi', () => {
  const instance = new HuggingfaceApi({ host: TEST_URL });

  test('getGlobalWhitelist calls whitelist url', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getHuggingFaceModels({}, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(HUGGINGFACE_MODELS({})),
      expect.objectContaining({ method: 'GET' }),
    );
  });
  test('getGlobalWhitelist calls whitelist url with query', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getHuggingFaceModels({ search: 'id' }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(HUGGINGFACE_MODELS({ search: 'id' })),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getModelDetails calls whitelist details url', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getModelDetails('name', 'sha', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(HUGGINGFACE_MODEL_DETAILS('name', 'sha')),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

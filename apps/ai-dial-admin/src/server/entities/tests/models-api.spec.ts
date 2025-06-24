import { DialModel } from '@/src/models/dial/model';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { ModelsApi } from '../models-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ModelsApi', () => {
  const instance = new ModelsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });
  const modelMock: DialModel = {
    name: 'test-model',
    description: 'Test description',
  };

  test('Should calls getModelsList', async () => {
    fetch.mockResponseOnce(JSON.stringify([modelMock]));

    const result = await instance.getModelsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/models'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([modelMock]));
  });

  test('Should calls getModel', async () => {
    fetch.mockResponseOnce(JSON.stringify(modelMock));

    const result = await instance.getModel('test-model', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/test-model'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(modelMock));
  });

  test('Should calls createModel', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createModel(modelMock, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(modelMock),
      }),
    );
  });

  test('Should calls updateModel', async () => {
    const updatedModel = { ...modelMock, description: 'Updated' };
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.updateModel(updatedModel, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/models/${modelMock.name}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedModel),
      }),
    );
  });

  test('Should calls removeModel', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeModel(TOKEN_MOCK, 'test-model');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/test-model'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls getModelsTopics', async () => {
    const mockResponse = { success: true, data: ['topic1', 'topic2'] };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.getModelsTopics(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/topics'), expect.objectContaining({ method: 'GET' }));
  });

  test('Should calls getModelsTokenizers', async () => {
    const mockResponse = { success: true, data: ['tokenizer1'] };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.getModelsTokenizers(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tokenizers'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

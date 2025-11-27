import { DialModel } from '@/src/models/dial/model';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
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

  test('Should calls getModelsListAction', async () => {
    fetch.mockResponseOnce(JSON.stringify([modelMock]));

    const result = await instance.getModelsListAction(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/models'), expect.objectContaining({ method: 'GET' }));
    expect(result.response).toEqual(JSON.stringify([modelMock]));
  });

  test('Should calls getModel', async () => {
    fetch.mockResponseOnce(JSON.stringify(modelMock));

    const result = await instance.getModel('test-model', TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/test-model'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(modelMock));
  });

  test('Should calls getCoreModel', async () => {
    fetch.mockResponseOnce(JSON.stringify(modelMock));

    const result = await instance.getCoreModel('test-model', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/core/test-model'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(modelMock));
  });

  test('Should calls createModel', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

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
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateModel(updatedModel, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/models/${modelMock.name}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedModel),
      }),
    );
  });

  test('Should calls updateModel', async () => {
    const updatedModel = { ...modelMock, description: 'Updated' };
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateModel({ ...updatedModel, name: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/models/`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...updatedModel, name: void 0 }),
      }),
    );
  });

  test('Should calls updateCoreModel', async () => {
    const updatedModel = { ...modelMock, description: 'Updated' };
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateCoreModel(updatedModel, 'model', 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/models/core/model`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedModel),
      }),
    );
  });

  test('Should calls removeModel', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeModel(TOKEN_MOCK, 'test-model');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/test-model'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls getModelsTopics', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getModelsTopics(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/topics'), expect.objectContaining({ method: 'GET' }));
  });

  test('Should calls getModelsTokenizers', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getModelsTokenizers(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tokenizers'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  createModel,
  getModelsAdapters,
  getModelsTokenizers,
  getModelsTopics,
  removeModel,
  updateModel,
} from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Models :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call get models topics', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: 'response' }));
    getModelsTopics().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call get models tokenizers', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: 'response' }));
    getModelsTokenizers().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call get models adapters', async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: 'response' }));
    getModelsAdapters().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call remove model', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeModel('model').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create model', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createModel({ name: 'model' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update model', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateModel({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

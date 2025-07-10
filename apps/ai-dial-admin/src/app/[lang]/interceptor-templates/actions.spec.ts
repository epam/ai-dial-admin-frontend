import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { getInterceptorTemplatesList, getInterceptorTemplate, createInterceptorTemplate, updateInterceptorTemplate, deleteInterceptorTemplate } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Interceptor templates :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call get interceptors templates list', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getInterceptorTemplatesList().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call get interceptor template', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getInterceptorTemplate('test').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call create interceptor template', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createInterceptorTemplate({ name: 'test', description: 'test' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
      expect(call?.body).toBe(JSON.stringify({ name: 'test', description: 'test' }));
    });
  });

  test('Should call update interceptor template', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateInterceptorTemplate({ name: 'test', description: 'test' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
      expect(call?.body).toBe(JSON.stringify({ name: 'test', description: 'test' }));
    });
  });

  test('Should call delete interceptor template', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    deleteInterceptorTemplate('test').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });
});

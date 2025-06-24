import { createInterceptor, removeInterceptor, updateInterceptor } from './actions';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Interceptors :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove interceptor', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeInterceptor('interceptor').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create interceptor', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createInterceptor({ name: 'interceptor' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update interceptor', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateInterceptor({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

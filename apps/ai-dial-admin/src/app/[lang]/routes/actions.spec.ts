import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { createRoute, getCoreRoute, removeRoute, updateCoreRoute, updateRoute } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Routes :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeRoute('route').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call get core route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getCoreRoute('route', 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });

  test('Should call create route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createRoute({ name: 'route' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateRoute({}, 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });

  test('Should call update core route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateCoreRoute({}, 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { createRoute, removeRoute, updateRoute } from './actions';

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
    updateRoute({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

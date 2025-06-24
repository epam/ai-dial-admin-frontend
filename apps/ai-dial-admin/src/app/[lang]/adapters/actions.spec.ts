import { createAdapter, removeAdapter, updateAdapter } from './actions';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('Adapters :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove adapter', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeAdapter('adapter').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create adapter', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createAdapter({ name: 'adapter' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update adapter', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateAdapter({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { createAddon, removeAddon, updateAddon } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Addons :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove addon', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeAddon('addon').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create addon', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createAddon({ name: 'addon' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update addon', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateAddon({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

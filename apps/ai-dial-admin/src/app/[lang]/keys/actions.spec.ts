import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { createKey, removeKey, updateKey } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Keys :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove key', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeKey('key').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create key', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createKey({ key: 'key', project: 'project', secured: false }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update key', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateKey({ key: 'key', project: 'project', secured: false }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('PUT');
    });
  });
});

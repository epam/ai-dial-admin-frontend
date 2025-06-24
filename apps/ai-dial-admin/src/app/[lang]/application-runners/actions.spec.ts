import { createApplicationScheme, removeApplicationScheme, updateApplicationScheme } from './actions';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Applications schemes :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove application scheme', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeApplicationScheme('scheme').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create application scheme', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createApplicationScheme({ $id: 'scheme' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update application scheme', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateApplicationScheme({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { getApps, removeApp, moveApps, bulkDeleteApps } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Assets application server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call get apps', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getApps('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call remove app', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeApp('app').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call move apps', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    moveApps(['path'], 'newPath').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call bulk delete apps', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    bulkDeleteApps([{ path: 'path' }]).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});

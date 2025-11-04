import { createApplication, getApplication, removeApplication, updateApplication } from './actions';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Applications :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeApplication('application').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createApplication({ name: 'application' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateApplication({}, 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });

    test('Should call get application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getApplication('name', 'etag').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });
});

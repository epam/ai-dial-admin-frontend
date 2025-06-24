import { describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { getUsageLog } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Usage log :: server actions', () => {
  test('Should call get usage log', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getUsageLog().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });
});

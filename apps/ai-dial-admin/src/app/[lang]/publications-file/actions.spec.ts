import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { approveFile, declineFile } from './actions';
const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Publication Files :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call approve prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    approveFile('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call decline prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    declineFile('path', 'comment').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});

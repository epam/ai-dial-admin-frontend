import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { approvePublication, declinePublication } from '../publications';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Publications :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call approve publication', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    approvePublication('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call decline publication', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    declinePublication('path', 'comment').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call decline publication with empty comment', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    declinePublication('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});

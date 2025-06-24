import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { approvePrompt, declinePrompt } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Publication Prompts :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call approve prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    approvePrompt('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call decline prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    declinePrompt('path', 'comment').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call decline prompt with empty comment', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    declinePrompt('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});

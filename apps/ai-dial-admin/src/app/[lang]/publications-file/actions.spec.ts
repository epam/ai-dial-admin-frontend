import fetch from 'jest-fetch-mock';
import { approveFile, declineFile } from './actions';

describe('Publication Files :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call approve prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    approveFile('path').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call decline prompt', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    declineFile('path', 'comment').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });
});

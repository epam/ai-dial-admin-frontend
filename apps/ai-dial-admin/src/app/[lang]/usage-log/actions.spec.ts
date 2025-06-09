import fetch from 'jest-fetch-mock';
import { getUsageLog } from './actions';

describe('Usage log :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call get usage log', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    getUsageLog().then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('GET');
    });
  });
});

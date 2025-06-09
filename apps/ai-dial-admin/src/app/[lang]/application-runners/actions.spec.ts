import fetch from 'jest-fetch-mock';
import { createApplicationScheme, removeApplicationScheme, updateApplicationScheme } from './actions';

describe('Applications schemes :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove application scheme', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeApplicationScheme('scheme').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create application scheme', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createApplicationScheme({ $id: 'scheme' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update application scheme', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateApplicationScheme({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

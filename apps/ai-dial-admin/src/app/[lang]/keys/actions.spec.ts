import fetch from 'jest-fetch-mock';
import { createKey, removeKey, updateKey } from './actions';

describe('Keys :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove key', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeKey('key').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create key', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createKey({ key: 'key', project: 'project', secured: false }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update key', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateKey({ key: 'key', project: 'project', secured: false }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('PUT');
    });
  });
});

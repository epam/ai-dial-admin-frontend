import fetch from 'jest-fetch-mock';
import { createAdapter, removeAdapter, updateAdapter } from './actions';

describe('Adapters :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove adapter', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeAdapter('adapter').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create adapter', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createAdapter({ name: 'adapter' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update adapter', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateAdapter({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

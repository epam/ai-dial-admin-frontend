import fetch from 'jest-fetch-mock';
import { createAddon, removeAddon, updateAddon } from './actions';

describe('Addons :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove addon', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeAddon('addon').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create addon', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createAddon({ name: 'addon' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update addon', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateAddon({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

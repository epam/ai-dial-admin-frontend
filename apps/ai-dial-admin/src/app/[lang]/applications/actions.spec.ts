import fetch from 'jest-fetch-mock';
import { createApplication, removeApplication, updateApplication } from './actions';

describe('Applications :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeApplication('application').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createApplication({ name: 'application' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update application', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateApplication({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

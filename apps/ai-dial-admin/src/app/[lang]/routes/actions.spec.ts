import fetch from 'jest-fetch-mock';
import { createRoute, removeRoute, updateRoute } from './actions';

describe('Routes :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeRoute('route').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createRoute({ name: 'route' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update route', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateRoute({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

import fetch from 'jest-fetch-mock';
import { createInterceptor, removeInterceptor, updateInterceptor } from './actions';


describe('Interceptors :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove interceptor', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeInterceptor('interceptor').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];

      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create interceptor', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createInterceptor({ name: 'interceptor' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update interceptor', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateInterceptor({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

import fetch from 'jest-fetch-mock';
import { createRole, removeRole, updateRole } from './actions';

describe('Roles :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call remove role', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeRole('role').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  it('Should call create role', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createRole({ name: 'role' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  it('Should call update role', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateRole({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

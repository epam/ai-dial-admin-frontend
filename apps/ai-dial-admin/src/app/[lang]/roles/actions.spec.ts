import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { createRole, removeRole, updateRole } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Roles :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call remove role', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    removeRole('role').then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('DELETE');
    });
  });

  test('Should call create role', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    createRole({ name: 'role' }).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
    });
  });

  test('Should call update role', async () => {
    fetch.mockResponse(JSON.stringify({ data: 'response' }));
    updateRole({}).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('PUT');
    });
  });
});

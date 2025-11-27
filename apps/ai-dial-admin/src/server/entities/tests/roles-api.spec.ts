import { DialRole } from '@/src/models/dial/role';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { RolesApi } from '../roles-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: RolesApi', () => {
  const instance = new RolesApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  const exampleRole: DialRole = {
    name: 'admin',
    description: 'Administrator role',
  };

  test('Should calls getRolesList', async () => {
    fetch.mockResponseOnce(JSON.stringify([exampleRole]));

    const result = await instance.getRolesList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/roles'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([exampleRole]));
  });

  test('Should calls a core role by name', async () => {
    fetch.mockResponseOnce(JSON.stringify(exampleRole));

    const result = await instance.getCoreRole('admin', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/core/admin'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(exampleRole));
  });

  test('Should calls a single role by name', async () => {
    fetch.mockResponseOnce(JSON.stringify(exampleRole));

    const result = await instance.getRole('admin', TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/admin'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(exampleRole));
  });

  test('Should create a new role', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createRole(exampleRole, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(exampleRole),
      }),
    );
  });

  test('Should update core role', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const updatedRole = { ...exampleRole, description: 'Updated description' };
    await instance.updateCoreRole(updatedRole, 'role', 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/core/role'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedRole),
      }),
    );
  });

  test('Should update an existing role', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const updatedRole = { ...exampleRole, description: 'Updated description' };
    await instance.updateRole(updatedRole, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/admin'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedRole),
      }),
    );
  });

  test('Should update an existing role', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const updatedRole = { ...exampleRole, description: 'Updated description' };
    await instance.updateRole({ ...updatedRole, name: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...updatedRole, name: void 0 }),
      }),
    );
  });

  test('Should delete a role by name', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeRole(TOKEN_MOCK, 'admin');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/admin'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

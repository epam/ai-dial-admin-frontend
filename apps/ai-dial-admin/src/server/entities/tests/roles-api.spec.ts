import { RolesApi } from '../roles-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import fetch from 'jest-fetch-mock';
import { DialRole } from '@/src/models/dial/role';

describe('Server :: RolesApi', () => {
  const instance = new RolesApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  const exampleRole: DialRole = {
    name: 'admin',
    description: 'Administrator role',
  };

  it('Should calls getRolesList', async () => {
    fetch.mockResponseOnce(JSON.stringify([exampleRole]));

    const result = await instance.getRolesList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/roles'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([exampleRole]));
  });

  it('Should calls a single role by name', async () => {
    fetch.mockResponseOnce(JSON.stringify(exampleRole));

    const result = await instance.getRole('admin', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/admin'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(exampleRole));
  });

  it('Should create a new role', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createRole(exampleRole, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(exampleRole),
      }),
    );
  });

  it('Should update an existing role', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    const updatedRole = { ...exampleRole, description: 'Updated description' };
    await instance.updateRole(updatedRole, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/admin'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedRole),
      }),
    );
  });

  it('Should delete a role by name', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeRole(TOKEN_MOCK, 'admin');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/roles/admin'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

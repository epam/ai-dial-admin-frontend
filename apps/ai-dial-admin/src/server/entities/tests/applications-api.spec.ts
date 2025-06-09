import fetch from 'jest-fetch-mock';
import { ApplicationsApi, APPLICATIONS_URL, APPLICATION_URL } from '../applications-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { DialApplication } from '@/src/models/dial/application';

describe('Server :: ApplicationsApi', () => {
  const instance = new ApplicationsApi({ host: TEST_URL });

  const mockApp: DialApplication = {
    name: 'test-app',
    description: 'Test Application',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should calls getApplicationsList and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockApp]));

    const result = await instance.getApplicationsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${APPLICATIONS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockApp]));
  });

  it('Should calls getApplication by name and return application', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockApp));

    const result = await instance.getApplication(mockApp.name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL(mockApp.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(mockApp));
  });

  it('Should calls createApplication with correct payload', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createApplication(mockApp, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATIONS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockApp),
      }),
    );
  });

  it('Should calls updateApplication with correct payload', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.updateApplication(mockApp, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL(mockApp.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockApp),
      }),
    );
  });

  it('Should calls removeApplication with DELETE method', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeApplication(TOKEN_MOCK, mockApp.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL(mockApp.name)}`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});

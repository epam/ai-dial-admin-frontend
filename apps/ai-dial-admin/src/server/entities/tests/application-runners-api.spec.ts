import { DialApplicationScheme } from '@/src/models/dial/application';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { APPLICATION_SCHEMES_URL, APPLICATION_SCHEME_URL, ApplicationRunnersApi } from '../application-runners-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ApplicationRunnersApi', () => {
  const instance = new ApplicationRunnersApi({ host: TEST_URL });

  const mockScheme: DialApplicationScheme = {
    $id: 'app-scheme-123',
    title: 'Test Scheme',
    description: 'Schema description',
    type: 'object',
    properties: {},
    required: [],
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should fetch application schemes list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockScheme]));

    const result = await instance.getApplicationSchemesList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEMES_URL}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify([mockScheme]));
  });

  test('Should fetch a single application scheme by id', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockScheme]));

    await instance.getApplicationScheme(mockScheme.$id, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL(mockScheme.$id)}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls createApplicationScheme with correct data', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    await instance.createApplicationScheme(mockScheme, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEMES_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockScheme),
      }),
    );
  });

  test('Should calls updateApplicationScheme with correct data', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    const result = await instance.updateApplicationScheme(mockScheme, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL(mockScheme.$id)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockScheme),
      }),
    );
  });

  test('Should calls removeApplicationScheme with DELETE method', async () => {
    const response = { success: true };
    fetch.mockResponseOnce(JSON.stringify(response));

    await instance.removeApplicationScheme(TOKEN_MOCK, mockScheme.$id);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL(mockScheme.$id)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

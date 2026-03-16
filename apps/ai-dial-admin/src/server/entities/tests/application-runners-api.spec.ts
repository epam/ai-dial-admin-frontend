import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DialApplicationScheme, TypeEntity } from '@/src/models/dial/application';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  APPLICATION_SCHEMES_URL,
  APPLICATION_SCHEME_URL,
  ApplicationRunnersApi,
  CORE_APPLICATION_SCHEME_URL,
  RESOLVED_APPLICATION_SCHEME_URL,
} from '../application-runners-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ApplicationRunnersApi', () => {
  const instance = new ApplicationRunnersApi({ host: TEST_URL });

  const mockScheme: DialApplicationScheme = {
    $id: 'app-scheme-123',
    title: 'Test Scheme',
    description: 'Schema description',
    type: TypeEntity.OBJECT,
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

  test('Should fetch a core application scheme by id', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockScheme]));

    await instance.getCoreRunner(mockScheme.$id || '', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_APPLICATION_SCHEME_URL(mockScheme.$id || '')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should fetch a single application scheme by id', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockScheme]));

    await instance.getApplicationScheme(mockScheme.$id || '', TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL(mockScheme.$id)}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls createApplicationScheme with correct data', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createApplicationScheme(mockScheme, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEMES_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockScheme),
      }),
    );
  });

  test('Should calls updateCoreRunner with correct data', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateCoreRunner(mockScheme, 'runner', 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_APPLICATION_SCHEME_URL('runner')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockScheme),
      }),
    );
  });

  test('Should calls updateApplicationScheme with correct data', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateApplicationScheme(mockScheme, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL(mockScheme.$id)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockScheme),
      }),
    );
  });

  test('Should calls updateApplicationScheme with correct data', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateApplicationScheme({ ...mockScheme, $id: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL('')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...mockScheme, $id: void 0 }),
      }),
    );
  });

  test('Should calls removeApplicationScheme with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeApplicationScheme(TOKEN_MOCK, mockScheme.$id);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_SCHEME_URL(mockScheme.$id)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should fetch a resolved application scheme by id', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getResolvedApplicationScheme(mockScheme.$id || '', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${RESOLVED_APPLICATION_SCHEME_URL(mockScheme.$id || '')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

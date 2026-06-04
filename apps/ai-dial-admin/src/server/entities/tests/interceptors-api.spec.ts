import createFetchMock from 'vitest-fetch-mock';
import {
  InterceptorsApi,
  INTERCEPTORS_URL,
  INTERCEPTOR_URL,
  CONFIGURATION_URL,
  CORE_INTERCEPTOR_URL,
} from '../interceptors-api';
import { TEST_URL, TOKEN_MOCK, RESPONSE_MOCK } from '@/src/utils/tests/mock/api.mock';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: InterceptorsApi', () => {
  const instance = new InterceptorsApi({ host: TEST_URL });

  const mockInterceptor: DialInterceptor = {
    name: 'test-interceptor',
    description: 'Mock interceptor',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call getInterceptorsList with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockInterceptor]));

    const result = await instance.getInterceptorsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${INTERCEPTORS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockInterceptor]));
  });

  test('Should call getInterceptorsListAction with correct URL and method', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockInterceptor]));

    const result = await instance.getInterceptorsListAction(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${INTERCEPTORS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result.response).toEqual(JSON.stringify([mockInterceptor]));
  });

  test('should call getCoreInterceptor with correct name and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockInterceptor));

    const result = await instance.getCoreInterceptor('test-interceptor', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_INTERCEPTOR_URL('test-interceptor')}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockInterceptor));
  });

  test('should call getInterceptor with correct name and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockInterceptor));

    const result = await instance.getInterceptor('test-interceptor', TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL('test-interceptor')}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockInterceptor));
  });

  test('should call checkInterceptorByName with HEAD method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.checkInterceptorByName('test-interceptor', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL('test-interceptor')}`,
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  test('should encode name in checkInterceptorByName request', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const name = 'test interceptor';

    await instance.checkInterceptorByName(name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL(encodeURIComponent(name))}`,
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  test('Should call createInterceptor with POST method and body', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createInterceptor(mockInterceptor, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTORS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockInterceptor),
      }),
    );
  });

  test('Should call updateInterceptor with PUT method and body', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateInterceptor({ ...mockInterceptor, name: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL()}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...mockInterceptor, name: void 0 }),
      }),
    );
  });

  test('Should call updateInterceptor with PUT method and body', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateInterceptor(mockInterceptor, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL(mockInterceptor.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockInterceptor),
      }),
    );
  });

  test('Should call updateCoreInterceptor with PUT method and body', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateCoreInterceptor(mockInterceptor, 'interceptor', 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_INTERCEPTOR_URL('interceptor')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockInterceptor),
      }),
    );
  });

  test('Should calls removeInterceptor with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeInterceptor(TOKEN_MOCK, mockInterceptor.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL(mockInterceptor.name)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('should call getConfigurationSchema with correct name and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getConfigurationSchema('test-interceptor', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CONFIGURATION_URL('test-interceptor')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

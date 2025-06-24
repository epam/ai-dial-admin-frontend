import createFetchMock from 'vitest-fetch-mock';
import { InterceptorsApi, INTERCEPTORS_URL, INTERCEPTOR_URL } from '../interceptors-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
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

  test('should call getInterceptor with correct name and method', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockInterceptor));

    const result = await instance.getInterceptor('test-interceptor', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL('test-interceptor')}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(mockInterceptor));
  });

  test('Should call createInterceptor with POST method and body', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

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
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.updateInterceptor(mockInterceptor, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL(mockInterceptor.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockInterceptor),
      }),
    );
  });

  test('Should calls removeInterceptor with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.removeInterceptor(TOKEN_MOCK, mockInterceptor.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_URL(mockInterceptor.name)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

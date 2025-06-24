import { DialRoute } from '@/src/models/dial/route';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { RoutesApi } from '../routes-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: RoutesApi', () => {
  const instance = new RoutesApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });
  const mockRoute: DialRoute = {
    name: 'route-1',
    description: 'Test route',
  };

  test('Should calls getRoutesList', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockRoute]));

    const result = await instance.getRoutesList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/routes'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockRoute]));
  });

  test('Should calls getRoute', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockRoute));

    const result = await instance.getRoute('route-1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/routes/route-1'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(mockRoute));
  });

  test('Should calls createRoute', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createRoute(mockRoute, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/routes'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockRoute),
      }),
    );
  });

  test('Should call updateRoute', async () => {
    const updatedRoute = { ...mockRoute, description: 'Updated' };
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.updateRoute(updatedRoute, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/routes/route-1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedRoute),
      }),
    );
  });

  test('Should call removeRoute', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeRoute(TOKEN_MOCK, 'route-1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/routes/route-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

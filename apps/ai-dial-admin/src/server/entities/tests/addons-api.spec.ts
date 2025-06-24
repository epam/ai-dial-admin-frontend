import { DialAddon } from '@/src/models/dial/addon';
import { ServerActionResponse } from '@/src/models/server-action';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { AddonsApi } from '../addons-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: AddonsApi', () => {
  const instance = new AddonsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  const addon: DialAddon = {
    name: 'test-addon',
    description: 'Test Addon',
  } as DialAddon;

  const mockResponse: ServerActionResponse = { success: true };

  test('Should calls getAddonsList and sends GET request and returns list of addons', async () => {
    fetch.mockResponseOnce(JSON.stringify([addon]));

    const result = await instance.getAddonsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/addons'), expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([addon]));
  });

  test('Should calls createAddon and sends POST request with addon and returns response', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createAddon(addon, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/addons'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(addon),
      }),
    );
  });

  test('Should calls removeAddon and sends DELETE request and returns response', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeAddon(TOKEN_MOCK, addon.name);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/addons/${addon.name}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls getAddon and sends GET request for a single addon', async () => {
    fetch.mockResponseOnce(JSON.stringify(addon));

    const result = await instance.getAddon(addon.name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/addons/${addon.name}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(addon));
  });

  test('Should calls updateAddon and sends PUT request with updated addon and returns response', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.updateAddon(addon, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/addons/${addon.name}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(addon),
      }),
    );
  });
});

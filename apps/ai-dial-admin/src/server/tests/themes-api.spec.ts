import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { THEME_REVALIDATE_SECONDS } from '@/src/constants/theme';

import { ThemesApi } from '../themes-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ThemesApi', () => {
  const instance = new ThemesApi();
  const cacheOptions = { next: { revalidate: THEME_REVALIDATE_SECONDS } };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('should return null on fetch failure for config', async () => {
    fetch.mockRejectOnce(new Error('Network error'));

    const result = await instance.getThemesConfiguration();

    expect(result).toBeNull();
  });

  test('should return void if icon fetch fails or response not ok', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

    const result = await instance.getThemeIconUrl('non-existent-icon.svg');

    expect(result).toBeUndefined();
  });

  test('should cache the config in the Data Cache for the revalidation window', async () => {
    fetch.mockResponseOnce(JSON.stringify({ themes: [], images: {} }));

    await instance.getThemesConfiguration();

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/config\.json$/), cacheOptions);
  });

  test('should cache the image list in the Data Cache for the revalidation window', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));

    await instance.getImages();

    expect(fetch).toHaveBeenCalledWith(expect.any(String), cacheOptions);
  });

  test('should cache an icon in the Data Cache for the revalidation window', async () => {
    fetch.mockResponseOnce('<svg />');

    await instance.getThemeIconUrl('logo.svg');

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/logo\.svg$/), cacheOptions);
  });
});

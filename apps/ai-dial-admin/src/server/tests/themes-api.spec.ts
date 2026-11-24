import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { THEME_FETCH_TIMEOUT_MS, THEME_REVALIDATE_SECONDS } from '@/src/constants/theme';

import { ThemesApi } from '../themes-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ThemesApi', () => {
  const instance = new ThemesApi();
  const cacheOptions = {
    next: { revalidate: THEME_REVALIDATE_SECONDS },
    signal: expect.any(AbortSignal),
  };
  const validConfig = { themes: [], images: { favicon: 'favicon.png' } };

  beforeEach(() => {
    fetch.resetMocks();
  });

  describe('getThemesConfiguration', () => {
    test('should return the config when it has the expected shape', async () => {
      fetch.mockResponseOnce(JSON.stringify(validConfig));

      const result = await instance.getThemesConfiguration();

      expect(result).toEqual(validConfig);
    });

    test('should return null on fetch failure for config', async () => {
      fetch.mockRejectOnce(new Error('Network error'));

      const result = await instance.getThemesConfiguration();

      expect(result).toBeNull();
    });

    test('should return null when the response status is not ok, even with a JSON body', async () => {
      fetch.mockResponseOnce(JSON.stringify(validConfig), { status: 404 });

      const result = await instance.getThemesConfiguration();

      expect(result).toBeNull();
    });

    test('should return null when the body is not JSON', async () => {
      fetch.mockResponseOnce('<html>not found</html>');

      const result = await instance.getThemesConfiguration();

      expect(result).toBeNull();
    });

    test.each([
      ['an error object without images', { message: 'not found' }],
      ['a config without themes', { images: {} }],
      ['a config whose themes is not an array', { themes: {}, images: {} }],
      ['a config whose images is not an object', { themes: [], images: 'x' }],
      ['null', null],
      ['an array', []],
    ])('should return null when the body is %s', async (_, body) => {
      fetch.mockResponseOnce(JSON.stringify(body));

      const result = await instance.getThemesConfiguration();

      expect(result).toBeNull();
    });

    test('should cache the config in the Data Cache for the revalidation window', async () => {
      fetch.mockResponseOnce(JSON.stringify(validConfig));

      await instance.getThemesConfiguration();

      expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/config\.json$/), cacheOptions);
    });

    test('should abort a request that the themes host never answers', async () => {
      vi.useFakeTimers();
      fetch.mockImplementationOnce(
        (_, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      );

      const pending = instance.getThemesConfiguration();
      await vi.advanceTimersByTimeAsync(THEME_FETCH_TIMEOUT_MS);

      expect(await pending).toBeNull();
    });
  });

  describe('getImages', () => {
    test('should return the image list', async () => {
      fetch.mockResponseOnce(JSON.stringify([{ name: 'logo.svg' }]));

      const result = await instance.getImages();

      expect(result).toEqual([{ name: 'logo.svg' }]);
    });

    test('should return null when the body is JSON but not a list', async () => {
      fetch.mockResponseOnce(JSON.stringify({ message: 'forbidden' }));

      const result = await instance.getImages();

      expect(result).toBeNull();
    });

    test('should return null on fetch failure', async () => {
      fetch.mockRejectOnce(new Error('Network error'));

      const result = await instance.getImages();

      expect(result).toBeNull();
    });

    test('should return null when the response status is not ok', async () => {
      fetch.mockResponseOnce(JSON.stringify([]), { status: 500 });

      const result = await instance.getImages();

      expect(result).toBeNull();
    });

    test('should cache the image list in the Data Cache for the revalidation window', async () => {
      fetch.mockResponseOnce(JSON.stringify([]));

      await instance.getImages();

      expect(fetch).toHaveBeenCalledWith(expect.any(String), cacheOptions);
    });
  });

  describe('getThemeIconUrl', () => {
    test('should return void if icon fetch fails or response not ok', async () => {
      fetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const result = await instance.getThemeIconUrl('non-existent-icon.svg');

      expect(result).toBeUndefined();
    });

    test('should return void when the icon request rejects', async () => {
      fetch.mockRejectOnce(new Error('Network error'));

      const result = await instance.getThemeIconUrl('logo.svg');

      expect(result).toBeUndefined();
    });

    test('should cache an icon in the Data Cache for the revalidation window', async () => {
      fetch.mockResponseOnce('<svg />');

      await instance.getThemeIconUrl('logo.svg');

      expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/logo\.svg$/), cacheOptions);
    });
  });
});

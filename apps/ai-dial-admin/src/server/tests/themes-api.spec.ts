import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { ThemesApi } from '../themes-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ThemesApi', () => {
  const instance = new ThemesApi();

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
});

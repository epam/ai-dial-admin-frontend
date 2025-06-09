import fetch from 'jest-fetch-mock';
import { ThemesApi } from '../themes-api';
import { ThemeConfiguration } from '@/src/models/theme';

describe('Server :: ThemesApi', () => {
  const instance = new ThemesApi();

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should return null on fetch failure for config', async () => {
    fetch.mockRejectOnce(new Error('Network error'));

    const result = await instance.getThemesConfiguration();

    expect(result).toBeNull();
  });

  it('should return void if icon fetch fails or response not ok', async () => {
    fetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

    const result = await instance.getThemeIconUrl('non-existent-icon.svg');

    expect(result).toBeUndefined();
  });
});

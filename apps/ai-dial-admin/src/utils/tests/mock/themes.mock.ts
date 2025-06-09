import { ThemeConfiguration } from '@/src/models/theme';

export const THEME_URL_MOCK = 'https://my-theme.com';
export const THEME_CONFIG_MOCK: ThemeConfiguration = {
  themes: [{ id: 'dark', displayName: 'Dark', colors: {}, 'app-logo': 'logo.svg' }],
  images: { 'default-addon': 'image', 'default-model': 'image', favicon: 'favicon' },
};

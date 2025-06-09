import { ThemeConfiguration } from '@/src/models/theme';

const THEMES_URL = process.env.THEMES_CONFIG_URL || '';

export class ThemesApi {
  getThemesConfiguration(): Promise<ThemeConfiguration | null> {
    return fetch(`${THEMES_URL}/config.json`)
      .then((res) => res.json())
      .catch(() => null);
  }

  async getThemeIconUrl(iconName: string): Promise<Response | void> {
    if (THEMES_URL == null) {
      return;
    }

    const imageUrl = `${THEMES_URL}/${iconName}`;

    const responseIcon = await fetch(imageUrl).catch(() => null);
    if (!responseIcon || !responseIcon.ok) {
      return;
    }

    return responseIcon;
  }
}

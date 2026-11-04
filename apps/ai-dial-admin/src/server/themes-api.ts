import { THEME_REVALIDATE_SECONDS } from '@/src/constants/theme';
import { ThemeConfiguration } from '@/src/models/theme';

const THEMES_URL = process.env.THEMES_CONFIG_URL || '';
const THEME_FETCH_OPTIONS: RequestInit = { next: { revalidate: THEME_REVALIDATE_SECONDS } };

export class ThemesApi {
  getThemesConfiguration(): Promise<ThemeConfiguration | null> {
    return fetch(`${THEMES_URL}/config.json`, THEME_FETCH_OPTIONS)
      .then((res) => res.json())
      .catch(() => null);
  }

  getImages(): Promise<{ name: string }[] | null> {
    return fetch(THEMES_URL, THEME_FETCH_OPTIONS)
      .then((res) => res.json())
      .catch(() => null);
  }

  async getThemeIconUrl(iconName: string): Promise<Response | void> {
    if (THEMES_URL == null) {
      return;
    }

    const imageUrl = `${THEMES_URL}/${iconName}`;

    // The Data Cache skips bodies over 2MB, so an oversized image is fetched upstream on every request.
    const responseIcon = await fetch(imageUrl, THEME_FETCH_OPTIONS).catch(() => null);
    if (!responseIcon || !responseIcon.ok) {
      return;
    }

    return responseIcon;
  }
}

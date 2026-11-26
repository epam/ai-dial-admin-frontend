import { THEME_FETCH_TIMEOUT_MS, THEME_REVALIDATE_SECONDS } from '@/src/constants/theme';
import { ThemeConfiguration } from '@/src/models/theme';

const THEMES_URL = process.env.THEMES_CONFIG_URL || '';

// The signal is created per call: AbortSignal.timeout starts counting when it is created.
const getThemeFetchOptions = (): RequestInit => ({
  next: { revalidate: THEME_REVALIDATE_SECONDS },
  signal: AbortSignal.timeout(THEME_FETCH_TIMEOUT_MS),
});

// The themes host is optional decoration, so anything unusable from it (unreachable, slow, an error status,
// valid JSON of another shape) resolves to null instead of failing the page that renders it.
const fetchJson = async (url: string): Promise<unknown> => {
  try {
    const res = await fetch(url, getThemeFetchOptions());
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
};

const isThemeConfiguration = (data: unknown): data is ThemeConfiguration => {
  const config = data as Partial<ThemeConfiguration> | null;
  return Array.isArray(config?.themes) && config.images != null && typeof config.images === 'object';
};

export class ThemesApi {
  async getThemesConfiguration(): Promise<ThemeConfiguration | null> {
    const data = await fetchJson(`${THEMES_URL}/config.json`);
    return isThemeConfiguration(data) ? data : null;
  }

  async getImages(): Promise<{ name: string }[] | null> {
    const data = await fetchJson(THEMES_URL);
    return Array.isArray(data) ? data : null;
  }

  async getThemeIconUrl(iconName: string): Promise<Response | void> {
    if (THEMES_URL == null) {
      return;
    }

    const imageUrl = `${THEMES_URL}/${iconName}`;

    // The Data Cache skips bodies over 2MB, so an oversized image is fetched upstream on every request.
    const responseIcon = await fetch(imageUrl, getThemeFetchOptions()).catch(() => null);
    if (!responseIcon || !responseIcon.ok) {
      return;
    }

    return responseIcon;
  }
}

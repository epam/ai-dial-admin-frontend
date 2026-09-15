import { LocalizedText } from '@/src/models/dial/localized';

/**
 * The locale a map is read under when nothing else says which to prefer. DIAL Core falls back to
 * `en` for a missing `Config.defaultLocale`, and that setting is exposed through no endpoint, so the
 * console cannot know the deployment's real default.
 */
export const FALLBACK_LOCALE = 'en';

export const isLocalizedMap = (value?: LocalizedText): value is Record<string, string> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const resolveLocalizedText = (value?: LocalizedText): string | undefined => {
  if (!isLocalizedMap(value)) {
    return value;
  }
  const resolved = value[FALLBACK_LOCALE] ?? Object.values(value).find((entry) => typeof entry === 'string');
  return typeof resolved === 'string' ? resolved : undefined;
};

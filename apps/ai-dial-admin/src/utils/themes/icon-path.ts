import { ApiRoute } from '@/src/constants/api-routes';

export const getIconPath = (iconName?: string): string => {
  if (!iconName) {
    return `${ApiRoute.Themes}/`;
  }

  // Keep absolute app paths and full URLs untouched.
  if (iconName.startsWith('/') || /^https?:\/\//i.test(iconName)) {
    return iconName;
  }

  return `${ApiRoute.Themes}/${encodeURIComponent(iconName)}`;
};

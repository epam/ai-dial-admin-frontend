import { ApiRoute } from '@/src/constants/api-routes';

export const getIconPath = (iconName?: string): string => {
  return `${ApiRoute.Themes}/${encodeURIComponent(iconName || '')}`;
};

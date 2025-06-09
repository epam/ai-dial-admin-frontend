export const getIconPath = (iconName?: string): string => {
  return `/api/themes/${encodeURIComponent(iconName || '')}`;
};

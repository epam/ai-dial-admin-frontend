import { MenuGroupConfiguration } from '@/src/components/Menu/menu-configuration';

export const getMenuItems = (value?: string): string[] => {
  return !value ? [] : value.toLowerCase().split(' ');
};

export const getActualMenuItems = (
  menuConfig: MenuGroupConfiguration[],
  disableItems: string[],
): MenuGroupConfiguration[] => {
  return menuConfig
    .filter((config) => !disableItems?.includes(parseKey(config.key)))
    .map((config) => ({
      ...config,
      items: config.items.filter((item) => !disableItems?.includes(parseKey(item.key))),
    }))
    .filter((config) => config.items.length > 0);
};

// item.key can be an i18n key like 'Menu.Catalog' or a plain key like 'Models'
const parseKey = (rawKey: string): string => {
  const key = rawKey.includes('.') ? rawKey.split('.')[1] : rawKey;
  return key.toLowerCase();
};

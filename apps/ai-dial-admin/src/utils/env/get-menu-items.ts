import { MenuGroupConfiguration, MenuItem } from '@/src/components/Menu/menu-configuration';

export const getMenuItems = (value?: string): string[] => {
  return !value ? [] : value.toLowerCase().split(' ');
};

export const getActualMenuItems = (
  menuConfig: MenuGroupConfiguration[],
  disableItems: string[],
): MenuGroupConfiguration[] => {
  return menuConfig
    .map((config) => {
      return {
        ...config,
        items: config.items.filter((item) => {
          const key = getItemKey(item);
          return !disableItems?.includes(key);
        }),
      };
    })
    .filter((config) => config.items.length > 0);
};

const getItemKey = (item: MenuItem) => {
  const key = item.key.includes('.') ? item.key.split('.')[1] : item.key; //item.key - can be with i18n key
  return key.toLowerCase();
};

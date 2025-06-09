import { MenuGroupConfiguration, MenuItem } from '@/src/components/Menu/menu-configuration';
import { EmbeddedApp } from '@/src/context/AppContext';
import { MenuI18nKey } from '@/src/constants/i18n';

export const getMenuItems = (value?: string): string[] => {
  return !value ? [] : value.toLowerCase().split(' ');
};

export const getActualMenuItems = (
  menuConfig: MenuGroupConfiguration[],
  disableItems: string[],
  embeddedApps: EmbeddedApp[] = [],
): MenuGroupConfiguration[] => {
  return menuConfig
    .map((config) => {
      if (config.key === MenuI18nKey.MLOps) {
        return {
          ...config,
          items: embeddedApps.map((app) => {
            return {
              key: app.key,
              href: app.slug,
            } as MenuItem;
          }),
        };
      }

      return config;
    })
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

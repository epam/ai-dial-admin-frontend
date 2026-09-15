import { describe, expect, test } from 'vitest';

import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';

const t = (key: string) => key;

describe('Catalog schema asset :: tab set', () => {
  test('Should expose exactly Properties and Parameters', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.PlatformCatalogSchemas);

    expect(tabs.map((tab) => tab.id)).toEqual([EntityViewTab.Properties, EntityViewTab.Parameters]);
  });

  test.each([
    EntityViewTab.Features,
    EntityViewTab.AppRoutes,
    EntityViewTab.Interceptors,
    EntityViewTab.Roles,
    EntityViewTab.Audit,
  ])('Should not expose the %s tab', (tab) => {
    const tabs = getTabsForAsset(t, ApplicationRoute.PlatformCatalogSchemas);

    expect(tabs.map((item) => item.id)).not.toContain(tab);
  });
});

describe('Catalog schema asset :: menu placement', () => {
  const catalogItems = (flags: Partial<FeatureFlags> = {}) =>
    MENU_CONFIGURATION(16, { adminApiEnabled: true, ...flags } as FeatureFlags).find(
      (group) => group.key === MenuI18nKey.Catalog,
    )?.items ?? [];

  test('Should follow App Runners and precede Roles in the Catalog group', () => {
    const keys = catalogItems().map((item) => item.key);
    const index = keys.indexOf(MenuI18nKey.PlatformCatalogSchemas);

    expect(keys[index - 1]).toEqual(MenuI18nKey.PlatformAppRunners);
    expect(keys[index + 1]).toEqual(MenuI18nKey.PlatformRoles);
  });

  test('Should link to the platform-catalog-schemas route', () => {
    const item = catalogItems().find((entry) => entry.key === MenuI18nKey.PlatformCatalogSchemas);

    expect(item?.href).toEqual(ApplicationRoute.PlatformCatalogSchemas);
  });
});
